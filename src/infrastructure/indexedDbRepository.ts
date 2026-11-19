import type { IdentifiedRecord } from "../domain/models.ts";
import type { Repository } from "../domain/repositories.ts";

export class LocalDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalDataError";
  }
}

export class IndexedDbRepository<
  T extends IdentifiedRecord,
> implements Repository<T> {
  private readonly database: Promise<IDBDatabase>;
  private readonly storeName: string;

  constructor(database: Promise<IDBDatabase>, storeName: string) {
    this.database = database;
    this.storeName = storeName;
  }

  async get(id: string): Promise<T | undefined> {
    const record = await this.request<T | undefined>("readonly", (store) =>
      store.get(id),
    );
    return record === undefined ? undefined : this.validate(record);
  }

  async getAll(): Promise<T[]> {
    const records = await this.request<T[]>("readonly", (store) =>
      store.getAll(),
    );
    return records.map((record) => this.validate(record));
  }

  async put(record: T): Promise<void> {
    this.validate(record);
    await this.request<IDBValidKey>("readwrite", (store) => store.put(record));
  }

  async delete(id: string): Promise<void> {
    await this.request<undefined>("readwrite", (store) => store.delete(id));
  }

  async clear(): Promise<void> {
    await this.request<undefined>("readwrite", (store) => store.clear());
  }

  private async request<Result>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<Result>,
  ): Promise<Result> {
    const database = await this.database;

    return new Promise<Result>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, mode);
      const request = operation(transaction.objectStore(this.storeName));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        reject(
          request.error ?? new LocalDataError("Local data request failed."),
        );
      };
      transaction.onerror = () => {
        reject(
          transaction.error ??
            new LocalDataError("Local data transaction failed."),
        );
      };
    });
  }

  private validate(record: T): T {
    if (
      typeof record !== "object" ||
      record === null ||
      typeof record.id !== "string" ||
      record.id === ""
    ) {
      throw new LocalDataError(
        `Invalid record found in local ${this.storeName} storage.`,
      );
    }

    return record;
  }
}

export function openIndexedDatabase(
  name: string,
  storeNames: readonly string[],
  factory: IDBFactory = indexedDB,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      for (const storeName of storeNames) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(
        request.error ?? new LocalDataError("Unable to open local storage."),
      );
    };
  });
}
