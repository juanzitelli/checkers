const KNOWN_HTML_IDS = {
  userDataForm: "data-submission__form",
};

const KNOWN_EVENT_NAMES = {
  submit: "submit",
};

const KNOWN_HTTP_METHODS = {
  post: "post",
};

async function postFormDataAsJson({ url, formData }) {
  const plainFormData = Object.fromEntries(formData.entries());
  const formDataJsonString = JSON.stringify(plainFormData);

  const fetchOptions = {
    method: KNOWN_HTTP_METHODS.post,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: formDataJsonString,
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }

  return response.json();
}

const onSubmitEventHandler = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const url = form.action;

  try {
    const formData = new FormData(form);
    const { token } = await postFormDataAsJson({ url, formData });

    alert(`Request was sent successfully! 🥳 API responded with: ${token}`);
  } catch (error) {
    alert(`Something went wrong... 😑 API responded with: ${error}`);
    console.error(error);
  }
};

const setupFormSubmission = ({ formId }) => {
  const form = document.getElementById(formId);
  form.addEventListener(KNOWN_EVENT_NAMES.submit, onSubmitEventHandler);
};

setupFormSubmission({ formId: KNOWN_HTML_IDS.userDataForm });
