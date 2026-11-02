import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  it("renders labelled fields whose limits match the contact API schema", () => {
    const markup = renderToStaticMarkup(<ContactForm />);

    expect(markup).toContain("<span>Name</span>");
    expect(markup).toContain('maxLength="100"');
    expect(markup).toContain('maxLength="254"');
    expect(markup).toContain('maxLength="200"');
    expect(markup).toContain('maxLength="5000"');
    expect(markup).toContain("At least 20 characters");
  });

  it("uses provided defaults for name and email only", () => {
    const markup = renderToStaticMarkup(
      <ContactForm defaultEmail="a@example.com" defaultName="Ayesha" />,
    );

    expect(markup).toContain('value="Ayesha"');
    expect(markup).toContain('value="a@example.com"');
  });
});
