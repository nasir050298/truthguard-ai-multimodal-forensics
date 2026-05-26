import { create } from "zustand";
import { User } from "../types";
import { loginApi } from "../services/api";

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: JSON.parse(localStorage.getItem("truthguard_user") || "null"),
  token: localStorage.getItem("truthguard_token"),

  login: async (email, password) => {
    const data = await loginApi(email, password);

    localStorage.setItem("truthguard_user", JSON.stringify(data.user));
    localStorage.setItem("truthguard_token", data.token);

    set({
      user: data.user,
      token: data.token,
    });
  },

  logout: () => {
    localStorage.removeItem("truthguard_user");
    localStorage.removeItem("truthguard_token");

    set({
      user: null,
      token: null,
    });
  },
}));