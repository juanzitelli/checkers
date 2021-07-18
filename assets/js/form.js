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
