import { api } from "../config/axios.config";
import type { User } from "./userService";

export default {
    async login(hashedEmail: string): Promise<string> {
        const res = await api.post<{ token: string }>("/auth/login", { hashedEmail });
        const token = res.data?.token;
        if (token) localStorage.setItem("token", token);
        return token;
    },

    async register(hashedEmail: string, username: string, color: string): Promise<User> {
        const res = await api.post<User>("/auth/register", { hashedEmail, username, color });
        return res.data;
    },
}