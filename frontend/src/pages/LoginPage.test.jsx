import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../context/AuthContext";
import LoginPage from "./LoginPage";

function renderLogin(login = vi.fn()) {
  render(
    <AuthContext.Provider value={{ login, isAuthenticated: false }}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Overview page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return { login };
}

const submit = (user) => user.click(screen.getByRole("button", { name: /log in|sign in/i }));

describe("LoginPage", () => {
  it("asks for both fields before calling the API", async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await submit(user);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your username and password.");
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and opens the overview", async () => {
    const user = userEvent.setup();
    const { login } = renderLogin(vi.fn().mockResolvedValue({}));
    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "admin123");
    await submit(user);
    expect(login).toHaveBeenCalledWith({ username: "admin", password: "admin123" });
    expect(await screen.findByText("Overview page")).toBeInTheDocument();
  });

  it("shows the lockout message after too many attempts", async () => {
    const user = userEvent.setup();
    const locked = new AxiosError("Too many", "ERR_BAD_REQUEST", {}, null, {
      status: 429,
      data: { message: "Too many failed attempts. Try again in 15 minutes." },
    });
    renderLogin(vi.fn().mockRejectedValue(locked));
    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "nope");
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many failed attempts");
  });

  it("shows why the last session ended", () => {
    sessionStorage.setItem("auth_message", "Your session has expired. Please log in again.");
    renderLogin();
    expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired");
  });
});
