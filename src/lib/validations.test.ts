import { sanitizeString } from "./validations";

describe("sanitizeString", () => {
  describe("HTML tag removal", () => {
    it("should remove script tags and their content", () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("should handle encoded HTML entities without re-introducing tags", () => {
      // This tests the critical behavior: NOT decoding entities
      const input = "&lt;script&gt;alert(1)&lt;/script&gt;";
      const result = sanitizeString(input);
      // After sanitizeString, entities should remain as text (not decoded)
      expect(result).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(result).not.toContain("<script>");
    });

    it("should remove bold tags", () => {
      const input = "<b>bold</b>";
      const result = sanitizeString(input);
      expect(result).toBe("bold");
    });

    it("should handle nested tags", () => {
      const input = "<div><b>nested</b></div>";
      const result = sanitizeString(input);
      expect(result).toBe("nested");
    });

    it("should remove self-closing tags", () => {
      const input = "text<br/>more";
      const result = sanitizeString(input);
      expect(result).toBe("textmore");
    });

    it("should remove tags with attributes", () => {
      const input = '<img src="evil.jpg" onclick="alert(1)">';
      const result = sanitizeString(input);
      expect(result).toBe("");
    });

    it("should remove multiple tags", () => {
      const input = "<p>Hello</p><script>bad()</script><span>World</span>";
      const result = sanitizeString(input);
      expect(result).toBe("HelloWorld");
    });
  });

  describe("whitespace handling", () => {
    it("should trim leading whitespace", () => {
      const input = "   text";
      const result = sanitizeString(input);
      expect(result).toBe("text");
    });

    it("should trim trailing whitespace", () => {
      const input = "text   ";
      const result = sanitizeString(input);
      expect(result).toBe("text");
    });

    it("should preserve internal whitespace", () => {
      const input = "hello  world";
      const result = sanitizeString(input);
      expect(result).toBe("hello  world");
    });

    it("should trim after tag removal", () => {
      const input = "  <b>bold</b>  ";
      const result = sanitizeString(input);
      expect(result).toBe("bold");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = sanitizeString("");
      expect(result).toBe("");
    });

    it("should handle whitespace-only string", () => {
      const result = sanitizeString("   ");
      expect(result).toBe("");
    });

    it("should handle normal text unchanged", () => {
      const input = "normal text";
      const result = sanitizeString(input);
      expect(result).toBe("normal text");
    });

    it("should handle ampersands in text", () => {
      const input = "AT&T Company";
      const result = sanitizeString(input);
      expect(result).toBe("AT&T Company");
    });

    it("should handle special characters", () => {
      const input = "Price: $100 & quantity: 5";
      const result = sanitizeString(input);
      expect(result).toBe("Price: $100 & quantity: 5");
    });

    it("should handle malformed tags", () => {
      const input = "<tag without closing";
      const result = sanitizeString(input);
      // Should remove anything from < to >, or just the < if no closing >
      expect(result).not.toContain("<");
    });

    it("should handle tag-like text in quotes", () => {
      const input = 'Code: "<div>" example';
      const result = sanitizeString(input);
      expect(result).toBe('Code: "" example');
    });

    it("should prevent XSS through onerror attribute", () => {
      const input = '<img src=x onerror="alert(1)">';
      const result = sanitizeString(input);
      expect(result).not.toContain("alert");
      expect(result).not.toContain("onerror");
    });

    it("should prevent XSS through style attribute", () => {
      const input = '<div style="background:url(\'javascript:alert(1)\')">text</div>';
      const result = sanitizeString(input);
      expect(result).toBe("text");
    });

    it("should handle unicode content", () => {
      const input = "السلام <b>علیکم</b>";
      const result = sanitizeString(input);
      expect(result).toBe("السلام علیکم");
    });

    it("should handle emoji", () => {
      const input = "Hello 😀<script>alert(1)</script>World";
      const result = sanitizeString(input);
      expect(result).toBe("Hello 😀World");
    });
  });

  describe("combined scenarios", () => {
    it("complete XSS prevention: script injection with entities", () => {
      // Simulates a browser that might decode entities and execute JavaScript
      // Our function should return it as safe text
      const input = "&lt;script&gt;alert(1)&lt;/script&gt;";
      const result = sanitizeString(input);
      // Output should be the entity string, not a decoded script tag
      expect(result).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(result).not.toContain("<script>");
    });

    it("hostel description with HTML formatting", () => {
      const input = "<p>Modern hostel with <b>great facilities</b> and <i>affordable rates</i></p>";
      const result = sanitizeString(input);
      expect(result).toBe("Modern hostel with great facilities and affordable rates");
    });

    it("user rule with HTML attempt", () => {
      const input = "No <strong>loud</strong> noise after <script>trick()</script> 10 PM";
      const result = sanitizeString(input);
      expect(result).toBe("No loud noise after trick() 10 PM");
    });
  });
});
