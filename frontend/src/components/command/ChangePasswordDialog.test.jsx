import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import ChangePasswordDialog from "./ChangePasswordDialog";

async function fill(user, { current, next, confirm }) {
  if (current) await user.type(screen.getByLabelText("Current password"), current);
  if (next) await user.type(screen.getByLabelText("New password"), next);
  if (confirm) await user.type(screen.getByLabelText("Repeat new password"), confirm);
  await user.click(screen.getByRole("button", { name: "Change password" }));
}

describe("ChangePasswordDialog", () => {
  it("checks the form before calling the API", async () => {
    const user = userEvent.setup();
    const changePassword = vi.fn();
    render(<ChangePasswordDialog onClose={vi.fn()} changePassword={changePassword} />);

    await fill(user, { next: "short" });
    expect(screen.getByText("Enter your current password.")).toBeInTheDocument();
    expect(screen.getByText(/at least 10 characters/i, { selector: "p.text-outage" })).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password and closes", async () => {
    const user = userEvent.setup();
    const changePassword = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    const onChanged = vi.fn();
    render(<ChangePasswordDialog onClose={onClose} onChanged={onChanged} changePassword={changePassword} />);

    await fill(user, { current: "admin123", next: "much-longer-secret", confirm: "much-longer-secret" });
    expect(changePassword).toHaveBeenCalledWith("admin123", "much-longer-secret");
    expect(onChanged).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the server's reason when it refuses", async () => {
    const user = userEvent.setup();
    const error = new AxiosError("Bad request", "ERR_BAD_REQUEST", {}, null, {
      status: 400,
      data: { message: "Current password is incorrect" },
    });
    const onClose = vi.fn();
    render(<ChangePasswordDialog onClose={onClose} changePassword={vi.fn().mockRejectedValue(error)} />);

    await fill(user, { current: "wrong", next: "much-longer-secret", confirm: "much-longer-secret" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect");
    expect(onClose).not.toHaveBeenCalled();
  });
});
