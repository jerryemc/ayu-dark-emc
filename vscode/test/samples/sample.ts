/**
 * Fetch a user and cache the result.
 * @param id - the user id
 * @returns the user record
 */
import { readFile } from "node:fs/promises";

export enum Role { Admin = "admin", Guest = "guest" }

interface User<T extends object = {}> {
  readonly id: number;
  name: string;
  role: Role;
  meta?: T;
}

const CACHE = new Map<number, User>();
const isEmail = /^[\w.+-]+@\w+\.[a-z]{2,}$/i;

export class UserService {
  private retries = 3;

  constructor(private readonly baseUrl: string) {}

  async get(id: number): Promise<User | undefined> {
    if (CACHE.has(id)) return CACHE.get(id);
    const res = await fetch(`${this.baseUrl}/users/${id}?v=${1.5e3}`);
    const user = (await res.json()) as User;
    CACHE.set(id, user);
    console.log("loaded", user.name, isEmail.test(user.name), null, true);
    return user;
  }
}

const double = (xs: number[]) => xs.map((x) => x * 2).filter(Boolean);
