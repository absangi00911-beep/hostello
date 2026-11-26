"use client";

import { useState, type FormEvent } from "react";
import {
  Field,
  FormSection,
  controlProps,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./ListingFormFields";
import {
  BANK_LIMITS,
  maskAccountNumber,
  parseSavedBankDetails,
  readEarningsError,
  validateBankDetailFields,
  type BankDetailFieldErrors,
  type BankDetails,
} from "./ownerEarnings";

const emptyDetails: BankDetails = {
  bankAccountTitle: "",
  bankAccountNumber: "",
  bankName: "",
};

export function BankDetailsCard({
  details,
  onSaved,
}: {
  details: BankDetails | null;
  onSaved: (details: BankDetails) => void;
}) {
  const [editing, setEditing] = useState(false);
  // The account number is never prefilled: the full number stays off screen.
  const [values, setValues] = useState<BankDetails>(emptyDetails);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BankDetailFieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function startEditing() {
    setValues({
      bankAccountTitle: details?.bankAccountTitle ?? "",
      bankAccountNumber: "",
      bankName: details?.bankName ?? "",
    });
    setError(null);
    setSaved(false);
    setFieldErrors({});
    setEditing(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateBankDetailFields(values);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setError(null);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/owner/earnings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountTitle: values.bankAccountTitle.trim(),
          bankAccountNumber: values.bankAccountNumber.trim(),
          bankName: values.bankName.trim(),
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const next = response.ok ? parseSavedBankDetails(payload) : null;
      if (!next) {
        setError(
          readEarningsError(
            payload,
            "We couldn't save your bank details. Please try again.",
          ),
        );
        return;
      }
      onSaved(next);
      setEditing(false);
      setSaved(true);
    } catch {
      setError("We couldn't save your bank details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormSection
      description="Payouts are sent to this account."
      title="Bank details"
    >
      {saved ? (
        <p
          className="m-0 rounded-xl bg-brand-soft px-[13px] py-[11px] text-label text-brand-dark"
          role="status"
        >
          Bank details saved.
        </p>
      ) : null}

      {editing ? (
        <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
          {error ? (
            <p
              className="m-0 rounded-xl bg-surface-muted px-[13px] py-[11px] text-label text-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Field
            error={fieldErrors.bankAccountTitle}
            id="bank-title"
            label="Account title"
          >
            <input
              {...controlProps("bank-title", fieldErrors.bankAccountTitle)}
              autoComplete="off"
              className={fieldClassName}
              maxLength={BANK_LIMITS.bankAccountTitle}
              onChange={(event) => {
                setValues({ ...values, bankAccountTitle: event.currentTarget.value });
                setFieldErrors((current) => ({ ...current, bankAccountTitle: undefined }));
              }}
              type="text"
              value={values.bankAccountTitle}
            />
          </Field>
          <Field
            error={fieldErrors.bankAccountNumber}
            hint={
              details
                ? "Enter the full number again to change it. Your current number isn't shown."
                : "Account number or IBAN."
            }
            id="bank-number"
            label="Account number or IBAN"
          >
            <input
              {...controlProps(
                "bank-number",
                fieldErrors.bankAccountNumber,
                details
                  ? "Enter the full number again to change it. Your current number isn't shown."
                  : "Account number or IBAN.",
              )}
              autoComplete="off"
              className={fieldClassName}
              inputMode="text"
              maxLength={BANK_LIMITS.bankAccountNumber}
              onChange={(event) => {
                setValues({ ...values, bankAccountNumber: event.currentTarget.value });
                setFieldErrors((current) => ({ ...current, bankAccountNumber: undefined }));
              }}
              type="text"
              value={values.bankAccountNumber}
            />
          </Field>
          <Field
            error={fieldErrors.bankName}
            id="bank-name"
            label="Bank name"
          >
            <input
              {...controlProps("bank-name", fieldErrors.bankName)}
              autoComplete="off"
              className={fieldClassName}
              maxLength={BANK_LIMITS.bankName}
              onChange={(event) => {
                setValues({ ...values, bankName: event.currentTarget.value });
                setFieldErrors((current) => ({ ...current, bankName: undefined }));
              }}
              type="text"
              value={values.bankName}
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button className={primaryButtonClassName} disabled={isSaving} type="submit">
              {isSaving ? "Saving…" : "Save bank details"}
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={isSaving}
              onClick={() => setEditing(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : details ? (
        <div className="grid gap-3">
          <dl className="m-0 grid gap-2 text-body">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">Account title</dt>
              <dd className="m-0 font-semibold text-ink">{details.bankAccountTitle}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">Account</dt>
              <dd className="m-0 font-semibold text-ink">
                {maskAccountNumber(details.bankAccountNumber)}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">Bank</dt>
              <dd className="m-0 font-semibold text-ink">{details.bankName}</dd>
            </div>
          </dl>
          <div>
            <button className={secondaryButtonClassName} onClick={startEditing} type="button">
              Change bank details
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="m-0 text-body text-ink">
            You haven&apos;t added bank details yet. Add them so we can send
            your payouts.
          </p>
          <div>
            <button className={primaryButtonClassName} onClick={startEditing} type="button">
              Add bank details
            </button>
          </div>
        </div>
      )}
    </FormSection>
  );
}
