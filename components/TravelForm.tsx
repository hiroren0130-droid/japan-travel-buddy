"use client";

import type { FormEvent } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  destination: string;
  setDestination: (value: string) => void;

  days: string;
  setDays: (value: string) => void;

  travelers: string;
  setTravelers: (value: string) => void;

  budget: string;
  setBudget: (value: string) => void;

  interests: string;
  setInterests: (value: string) => void;

  specialRequest: string;
  setSpecialRequest: (value: string) => void;

  onSubmit: () => void;
  loading: boolean;
};

const INTEREST_OPTIONS = [
  "🏯 神社・お寺",
  "🍣 グルメ",
  "☕ カフェ",
  "🌿 自然",
  "♨️ 温泉",
  "🛍️ ショッピング",
  "🎌 アニメ・ゲーム",
  "🌃 夜景",
  "👨‍👩‍👧‍👦 家族向け",
  "💎 穴場スポット",
];

const DAY_OPTIONS = Array.from(
  { length: 14 },
  (_, index) => index + 1
);

const TRAVELER_OPTIONS = Array.from(
  { length: 10 },
  (_, index) => index + 1
);

const BUDGET_OPTIONS = [
  "指定なし",
  "10,000円",
  "30,000円",
  "50,000円",
  "100,000円",
  "150,000円",
  "200,000円以上",
];

const SPECIAL_REQUEST_MAX_LENGTH = 500;

export default function TravelForm({
  destination,
  setDestination,
  days,
  setDays,
  travelers,
  setTravelers,
  budget,
  setBudget,
  interests,
  setInterests,
  specialRequest,
  setSpecialRequest,
  onSubmit,
  loading,
}: Props) {
  const { messages: defaultMessages } = useLocale();

  const inputClass = [
    "w-full",
    "min-h-12",
    "rounded-xl",
    "border",
    "border-gray-300",
    "bg-white",
    "px-4",
    "py-3",
    "text-base",
    "text-gray-900",
    "outline-none",
    "transition",
    "placeholder:text-gray-400",
    "focus:border-blue-500",
    "focus:ring-2",
    "focus:ring-blue-200",
    "disabled:cursor-not-allowed",
    "disabled:bg-gray-100",
    "disabled:text-gray-400",
  ].join(" ");

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-800";

  const selectedInterests = interests
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);

  const trimmedDestination = destination.trim();

  const isFormReady =
    trimmedDestination.length > 0 &&
    days.length > 0 &&
    travelers.length > 0;

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || !isFormReady) {
      return;
    }

    if (
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }

    onSubmit();
  }

  function handleInterestChange(
    interest: string,
    checked: boolean
  ) {
    const updatedInterests = checked
      ? [...selectedInterests, interest]
      : selectedInterests.filter(
          (selectedInterest) =>
            selectedInterest !== interest
        );

    setInterests(updatedInterests.join(","));
  }

  function clearInterests() {
    if (loading) {
      return;
    }

    setInterests("");
  }

  return (
    <Card>
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={loading}
      >
        <div className="mb-7">
          <div className="flex items-start gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-blue-50
                text-xl
              "
              aria-hidden="true"
            >
              ✈️
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {defaultMessages.travelForm.title}
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-gray-500">
                {defaultMessages.travelForm.description}
              </p>
            </div>
          </div>

          <div
            className="
              mt-5
              rounded-xl
              border
              border-blue-100
              bg-blue-50/70
              px-4
              py-3
              text-sm
              leading-6
              text-blue-800
            "
          >
            <span className="font-semibold">
              {defaultMessages.travelForm.requiredLabel}
            </span>
            {defaultMessages.travelForm.requiredItems}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* Destination */}
          <div className="md:col-span-3">
            <label
              htmlFor="travel-destination"
              className={labelClass}
            >
              <span aria-hidden="true">📍</span>{" "}
              {defaultMessages.travelForm.destination.label}
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="travel-destination"
              name="destination"
              type="text"
              value={destination}
              onChange={(event) =>
                setDestination(event.target.value)
              }
              placeholder={defaultMessages.travelForm.destination.placeholder}
              className={inputClass}
              disabled={loading}
              required
              autoComplete="off"
              enterKeyHint="next"
              aria-describedby="destination-help"
            />

            <p
              id="destination-help"
              className="mt-2 text-xs leading-5 text-gray-500"
            >
              {defaultMessages.travelForm.destination.help}
            </p>
          </div>

          {/* Days */}
          <div>
            <label
              htmlFor="travel-days"
              className={labelClass}
            >
              <span aria-hidden="true">📅</span>{" "}
              {defaultMessages.travelForm.days.label}
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="travel-days"
              name="days"
              value={days}
              onChange={(event) =>
                setDays(event.target.value)
              }
              className={inputClass}
              disabled={loading}
              required
            >
              <option value="">
                {defaultMessages.travelForm.selectPlaceholder}
              </option>

              {DAY_OPTIONS.map((day) => (
                <option
                  key={day}
                  value={day}
                >
                  {day}{defaultMessages.travelForm.days.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Travelers */}
          <div>
            <label
              htmlFor="travel-travelers"
              className={labelClass}
            >
              <span aria-hidden="true">👥</span>{" "}
              {defaultMessages.travelForm.travelers.label}
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="travel-travelers"
              name="travelers"
              value={travelers}
              onChange={(event) =>
                setTravelers(event.target.value)
              }
              className={inputClass}
              disabled={loading}
              required
            >
              <option value="">
                {defaultMessages.travelForm.selectPlaceholder}
              </option>

              {TRAVELER_OPTIONS.map((person) => (
                <option
                  key={person}
                  value={person}
                >
                  {person}{defaultMessages.travelForm.travelers.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label
              htmlFor="travel-budget"
              className={labelClass}
            >
              <span aria-hidden="true">💴</span>{" "}
              {defaultMessages.travelForm.budget.label}
            </label>

            <select
              id="travel-budget"
              name="budget"
              value={budget}
              onChange={(event) =>
                setBudget(event.target.value)
              }
              className={inputClass}
              disabled={loading}
            >
              {BUDGET_OPTIONS.map((option, index) => (
                <option
                  key={option}
                  value={option}
                >
                  {defaultMessages.travelForm.budget.optionLabels[index]}
                </option>
              ))}
            </select>
          </div>

          {/* Interests */}
          <fieldset className="md:col-span-3">
            <div
              className="
                mb-3
                flex
                flex-wrap
                items-center
                justify-between
                gap-2
              "
            >
              <legend className="text-sm font-semibold text-gray-800">
                <span aria-hidden="true">🎯</span>{" "}
                {defaultMessages.travelForm.interests.label}
                <span className="ml-2 font-normal text-gray-500">
                  {defaultMessages.travelForm.interests.multipleSelection}
                </span>
              </legend>

              <div className="flex items-center gap-3">
                <span
                  className="
                    rounded-full
                    bg-gray-100
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    text-gray-600
                  "
                  aria-live="polite"
                >
                  {selectedInterests.length}
                  {defaultMessages.travelForm.interests.selectedSuffix}
                </span>

                {selectedInterests.length > 0 && (
                  <button
                    type="button"
                    onClick={clearInterests}
                    disabled={loading}
                    className="
                      text-xs
                      font-medium
                      text-blue-600
                      transition
                      hover:text-blue-800
                      disabled:cursor-not-allowed
                      disabled:text-gray-400
                    "
                  >
                    {defaultMessages.travelForm.interests.clearAll}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {INTEREST_OPTIONS.map((interest, index) => {
                const checked =
                  selectedInterests.includes(interest);

                return (
                  <label
                    key={interest}
                    className={[
                      "flex",
                      "min-h-14",
                      "cursor-pointer",
                      "items-center",
                      "gap-2.5",
                      "rounded-xl",
                      "border",
                      "px-3",
                      "py-3",
                      "text-sm",
                      "transition",
                      "focus-within:ring-2",
                      "focus-within:ring-blue-200",
                      loading
                        ? "cursor-not-allowed opacity-60"
                        : "",
                      checked
                        ? "border-blue-400 bg-blue-50 text-blue-900 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/50",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      name="interests"
                      value={interest}
                      checked={checked}
                      disabled={loading}
                      onChange={(event) =>
                        handleInterestChange(
                          interest,
                          event.target.checked
                        )
                      }
                      className="
                        h-4
                        w-4
                        shrink-0
                        rounded
                        border-gray-300
                        text-blue-600
                        accent-blue-600
                        focus:ring-blue-500
                      "
                    />

                    <span className="leading-5">
                      {defaultMessages.travelForm.interests.optionLabels[index]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Special request */}
          <div className="md:col-span-3">
            <div
              className="
                mb-2
                flex
                items-end
                justify-between
                gap-3
              "
            >
              <label
                htmlFor="travel-special-request"
                className="block text-sm font-semibold text-gray-800"
              >
                <span aria-hidden="true">✍️</span>{" "}
                {defaultMessages.travelForm.specialRequest.label}
                <span className="ml-2 font-normal text-gray-500">
                  {defaultMessages.travelForm.specialRequest.optional}
                </span>
              </label>

              <span
                className="text-xs text-gray-400"
                aria-live="polite"
              >
                {specialRequest.length}/
                {SPECIAL_REQUEST_MAX_LENGTH}
              </span>
            </div>

            <textarea
              id="travel-special-request"
              name="specialRequest"
              value={specialRequest}
              onChange={(event) =>
                setSpecialRequest(event.target.value)
              }
              placeholder={defaultMessages.travelForm.specialRequest.placeholder}
              rows={5}
              maxLength={SPECIAL_REQUEST_MAX_LENGTH}
              className={`${inputClass} resize-y leading-6`}
              disabled={loading}
              aria-describedby="special-request-help"
            />

            <p
              id="special-request-help"
              className="mt-2 text-xs leading-5 text-gray-500"
            >
              {defaultMessages.travelForm.specialRequest.help}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !isFormReady}
            className="w-full"
          >
            {loading
              ? defaultMessages.travelForm.submit.loading
              : defaultMessages.travelForm.submit.idle}
          </Button>

          {!loading && !isFormReady && (
            <p
              className="
                mt-3
                text-center
                text-xs
                leading-5
                text-gray-500
              "
              role="status"
            >
              {defaultMessages.travelForm.submit.incomplete}
            </p>
          )}

          {loading && (
            <p
              className="
                mt-3
                text-center
                text-xs
                leading-5
                text-blue-600
              "
              role="status"
              aria-live="polite"
            >
              {defaultMessages.travelForm.submit.loadingStatus}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
