const KNOWN_HTML_IDS = {
  userDataForm: "data-submission__form",
};

const KNOWN_CSS_CLASSES = {
  errorMessagesContainer: "error-messages-container",
};

const KNOWN_EVENT_NAMES = {
  submit: "submit",
};

const renderErrorMessage = (errorMessage) => {
  const errorMessagesContainer = document.querySelector(
    `.${KNOWN_CSS_CLASSES.errorMessagesContainer}`
  );

  const errorMessageElement = document.createElement("p");
  errorMessageElement.textContent = errorMessage;

  errorMessagesContainer.appendChild(errorMessageElement);
};

const onSubmitEventHandler = async (event) => {
  event.preventDefault();

  const form = document.getElementById(KNOWN_HTML_IDS.userDataForm);

  const { name, email, message } = form.elements;

  const {
    validateName,
    validateEmail,
    validateMessage,
    renderErrorsReset,
    errors,
  } = useFormValidations();

  renderErrorsReset();

  validateName(name.value);
  validateEmail(email.value);
  validateMessage(message.value);

  const errorMessages = Object.values(errors);

  if (errorMessages.length === 0) {
    window.location.href = `mailto:${email.value}?subject=${encodeURIComponent(
      name.value
    )}&body=${encodeURIComponent(message.value)}`;
    return;
  }

  errorMessages.forEach(renderErrorMessage);
};

const setupFormSubmission = ({ formId }) => {
  const { renderErrorsReset } = useFormValidations();
  const form = document.getElementById(formId);
  form.addEventListener(KNOWN_EVENT_NAMES.submit, onSubmitEventHandler);
  renderErrorsReset();
};

const useFormValidations = () => {
  const errors = {};

  const validateName = (name) => {
    const validNameRegularExpression = /([a-z]|[A-Z]|[0-9])/;

    const isNameValid =
      name
        .split("")
        .filter((char) => validNameRegularExpression.test(char))
        .join("").length === name.length;

    if (isNameValid) {
      return;
    }

    errors.name =
      "🔴 Name should be an alphanumeric value without spaces or special characterss.";
  };

  const validateEmail = (email) => {
    const validEmailRegularExpression =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const isEmailValid = validEmailRegularExpression.test(email);

    if (isEmailValid) {
      return;
    }

    errors.email = `🔴 Email should be valid (example: john@doe.com).`;
  };

  const validateMessage = (message) => {
    const isMessageValid = message.length > 5;

    if (isMessageValid) {
      return;
    }

    errors.message = `🔴 Message should contain more than 5 characters.`;
  };

  const renderErrorsReset = () => {
    const errorMessagesContainer = document.querySelector(
      `.${KNOWN_CSS_CLASSES.errorMessagesContainer}`
    );

    while (errorMessagesContainer.firstChild) {
      errorMessagesContainer.removeChild(errorMessagesContainer.lastChild);
    }
  };

  return {
    validateName,
    validateEmail,
    validateMessage,
    errors,
    renderErrorsReset,
  };
};

window.onload = setupFormSubmission({ formId: KNOWN_HTML_IDS.userDataForm });
