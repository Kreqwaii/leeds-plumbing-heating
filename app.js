(function () {
  "use strict";

  const JOBS = {
    "boiler-service": {
      label: "Boiler Service",
      min: 75,
      max: 95,
      note: "Includes visual safety inspection, burner check and flue analysis. Free written estimate confirmed before any parts are fitted."
    },
    "boiler-breakdown": {
      label: "Boiler Breakdown",
      min: 85,
      max: 145,
      note: "Covers diagnostic visit and first-hour repair labour. Replacement components quoted upfront in writing prior to fitting."
    },
    "leak-pipe": {
      label: "Leak & Pipe Repair",
      min: 65,
      max: 120,
      note: "Covers fault location, copper or compression joint repair and pressure check. No call-out fee applies."
    },
    "radiator-heating": {
      label: "Radiator & Heating",
      min: 60,
      max: 130,
      note: "Covers bleeding, balancing, thermostat or TRV fitting, or single radiator replacement labour."
    },
    "emergency-callout": {
      label: "Emergency Call-out",
      min: 95,
      max: 165,
      note: "Rapid isolation of active water leaks or urgent heating failure across Leeds. Zero hidden call-out surcharge."
    }
  };

  const URGENCY = {
    standard: {
      label: "Standard Weekday",
      addMin: 0,
      addMax: 0,
      window: "Next Weekday Slot"
    },
    "same-day": {
      label: "Same-Day",
      addMin: 20,
      addMax: 30,
      window: "Today Before 18:00"
    },
    emergency: {
      label: "Emergency",
      addMin: 40,
      addMax: 55,
      window: "1 to 3 Hours Target"
    }
  };

  const CORE_NORTH = new Set(["LS8", "LS14", "LS17", "LS22", "LS23"]);
  const EXTENDED_NORTH = new Set(["LS6", "LS7", "LS15", "LS16", "LS18", "LS19", "LS20", "LS21"]);

  const state = {
    job: "boiler-service",
    urgency: "standard",
    postcode: "LS17"
  };

  const jobButtons = document.querySelectorAll(".job-option");
  const urgencyButtons = document.querySelectorAll(".urgency-pill");
  const postcodeSelect = document.getElementById("postcode-select");
  const postcodeChips = document.querySelectorAll(".chip-btn");

  const summaryTagEl = document.getElementById("quote-summary-tag");
  const zonePillEl = document.getElementById("zone-pill");
  const priceRangeEl = document.getElementById("price-range");
  const priceNoteEl = document.getElementById("price-note");
  const arrivalWindowEl = document.getElementById("arrival-window");
  const zoneDetailEl = document.getElementById("zone-detail");

  const enquiryForm = document.getElementById("enquiry-form");
  const formErrorEl = document.getElementById("form-error");
  const confirmCardEl = document.getElementById("enquiry-confirmation");
  const confirmRefEl = document.getElementById("confirm-ref");
  const confirmSummaryEl = document.getElementById("confirm-summary");
  const mailtoLinkEl = document.getElementById("mailto-dispatch-link");
  const resetBtn = document.getElementById("reset-enquiry-btn");

  function getZoneInfo(code) {
    if (code === "LS17") {
      return {
        badge: "Home Base",
        detail: "Shadwell & North Leeds (LS17)",
        addMin: 0,
        addMax: 0
      };
    }
    if (CORE_NORTH.has(code)) {
      return {
        badge: "Core North Leeds",
        detail: "Direct Local Route (" + code + ")",
        addMin: 0,
        addMax: 0
      };
    }
    if (EXTENDED_NORTH.has(code)) {
      return {
        badge: "North & West Leeds",
        detail: "Standard Local Dispatch (" + code + ")",
        addMin: 0,
        addMax: 10
      };
    }
    return {
      badge: "Wider Leeds",
      detail: "Extended District Travel (" + code + ")",
      addMin: 10,
      addMax: 15
    };
  }

  function renderEstimate() {
    const job = JOBS[state.job];
    const urgency = URGENCY[state.urgency];
    const zone = getZoneInfo(state.postcode);

    const low = job.min + urgency.addMin + zone.addMin;
    const high = job.max + urgency.addMax + zone.addMax;

    summaryTagEl.textContent = (
      job.label + " · " + urgency.label + " · " + state.postcode
    ).toUpperCase();

    zonePillEl.textContent = zone.badge;
    priceRangeEl.textContent = "£" + low + " - £" + high;
    priceNoteEl.textContent = job.note;
    arrivalWindowEl.textContent = urgency.window;
    zoneDetailEl.textContent = zone.detail;
  }

  jobButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.job = btn.getAttribute("data-job");
      jobButtons.forEach(function (item) {
        const active = item === btn;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-checked", active ? "true" : "false");
      });
      renderEstimate();
    });
  });

  urgencyButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.urgency = btn.getAttribute("data-urgency");
      urgencyButtons.forEach(function (item) {
        const active = item === btn;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-checked", active ? "true" : "false");
      });
      renderEstimate();
    });
  });

  function syncPostcodeUI(code) {
    state.postcode = code;
    if (postcodeSelect.value !== code) {
      postcodeSelect.value = code;
    }
    postcodeChips.forEach(function (chip) {
      chip.classList.toggle("is-active", chip.getAttribute("data-postcode") === code);
    });
    renderEstimate();
  }

  postcodeSelect.addEventListener("change", function () {
    syncPostcodeUI(postcodeSelect.value);
  });

  postcodeChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      syncPostcodeUI(chip.getAttribute("data-postcode"));
    });
  });

  enquiryForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const nameInput = document.getElementById("customer-name");
    const phoneInput = document.getElementById("customer-phone");
    const notesInput = document.getElementById("customer-notes");

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const notes = notesInput.value.trim();

    if (!name || phone.replace(/\D/g, "").length < 7) {
      formErrorEl.textContent = "Please enter your name and a valid UK phone number so Mario can reply with your written estimate.";
      formErrorEl.hidden = false;
      return;
    }

    formErrorEl.hidden = true;

    const job = JOBS[state.job];
    const urgency = URGENCY[state.urgency];
    const rangeText = priceRangeEl.textContent;
    const refCode = "LPH-" + state.postcode + "-" + String(Math.floor(1000 + Math.random() * 9000));

    confirmRefEl.textContent = "REF: " + refCode;
    confirmSummaryEl.textContent =
      "Thank you, " + name + ". Your request for " + job.label + " (" + urgency.label + ") in " +
      state.postcode + " with guide range " + rangeText + " is ready to send to enquiries@leedsplumbingandheating.co.uk. " +
      "Mario responds on " + phone + " with a free written estimate.";

    const subject = encodeURIComponent("Estimate Request " + refCode + ": " + job.label + " (" + state.postcode + ")");
    const bodyLines = [
      "Reference: " + refCode,
      "Name: " + name,
      "Phone: " + phone,
      "Postcode: " + state.postcode,
      "Job Type: " + job.label,
      "Urgency: " + urgency.label,
      "Estimator Guide Range: " + rangeText + " (No Call-Out Fee)",
      "Details: " + (notes || "None provided")
    ].join("\n");

    mailtoLinkEl.setAttribute(
      "href",
      "mailto:enquiries@leedsplumbingandheating.co.uk?subject=" + subject + "&body=" + encodeURIComponent(bodyLines)
    );

    enquiryForm.hidden = true;
    confirmCardEl.hidden = false;
  });

  resetBtn.addEventListener("click", function () {
    confirmCardEl.hidden = true;
    enquiryForm.hidden = false;
    formErrorEl.hidden = true;
  });

  renderEstimate();
})();
