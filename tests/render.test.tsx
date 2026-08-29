import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function Sample() {
  return <p dir="rtl">שלום נופר</p>;
}

describe("test stack (jsdom + testing-library + jest-dom)", () => {
  it("renders RTL Hebrew text", () => {
    render(<Sample />);
    const el = screen.getByText("שלום נופר");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("dir", "rtl");
  });
});
