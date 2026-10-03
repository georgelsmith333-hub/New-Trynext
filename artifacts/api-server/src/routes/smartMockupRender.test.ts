import { describe, expect, it } from "vitest";
import { validationPassed } from "../lib/smartMockupValidation";

describe("Smart Mockup validation status gate", () => {
  it("requires every test and renderer availability to pass", () => {
    const base = {
      test1_openPsd: { pass: true },
      test2_findSmartObject: { pass: true },
      test3_replaceContent: { pass: true },
      test4_render: { pass: true },
      test5_outputExists: { pass: true },
      test6_outputDimensions: { pass: true },
      test7_outputNotBlank: { pass: true },
      test8_differsFromBlank: { pass: true },
      test9_withinTimeout: { pass: true },
      rendererAvailable: { available: true },
    };

    expect(validationPassed(base)).toBe(true);
    expect(validationPassed({ ...base, rendererAvailable: { available: false } })).toBe(false);
    expect(validationPassed({ ...base, test8_differsFromBlank: { pass: false } })).toBe(false);
    expect(validationPassed({ ...base, test9_withinTimeout: null })).toBe(false);
  });
});