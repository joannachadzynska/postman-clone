import axios from "axios";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import prettyBytes from "pretty-bytes";
import setupEditors from "./setupEditor.js";

const form = document.querySelector("[data-form]");
const queryParamsContainer = document.querySelector("[data-query-params]");
const requestHeadersContainer = document.querySelector(
    "[data-request-headers]"
);
const responseHeadersContainer = document.querySelector(
    "[data-response-headers]"
);
const keyValueTemplate = document.querySelector("[data-key-value-template]");
const queryParamAddBtn = document.querySelector("[data-add-query-param-btn]");
const requestHeaderAddBtn = document.querySelector(
    "[data-add-request-header-btn]"
);

queryParamAddBtn.addEventListener("click", () => {
    queryParamsContainer.append(createKeyValuePair());
});
requestHeaderAddBtn.addEventListener("click", () => {
    requestHeadersContainer.append(createKeyValuePair());
});

queryParamsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());

axios.interceptors.request.use((request) => {
    request.customData = request.customData || {};
    request.customData.startTime = new Date().getTime();
    return request;
});

axios.interceptors.response.use(updateEndTime, (e) => {
    return Promise.reject(updateEndTime(e.response));
});

const { requestEditor, updateResponseEditor } = setupEditors();

function updateEndTime(response) {
    response.customData = response.customData || {};
    response.customData.time =
        new Date().getTime() - response.config.customData.startTime;
    return response;
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    let data;
    try {
        data = JSON.parse(requestEditor.state.doc.toString() || null);
    } catch (error) {
        alert("JSON data is malformed");
        return;
    }

    axios({
        url: document.querySelector("[data-url]").value,
        method: document.querySelector("[data-method]").value,
        params: keyValueParisToObject(queryParamsContainer),
        headers: keyValueParisToObject(requestHeadersContainer),
        data,
    })
        .catch((e) => {
            // e.response;
            return e;
        })
        .then((resp) => {
            document
                .querySelector("[data-response-section]")
                .classList.remove("d-none");

            updateResponseDetails(resp);
            updateResponseEditor(resp.data);
            updateResponseHeaders(resp.headers);
        });
});

function updateResponseDetails(response) {
    document.querySelector("[data-status]").textContent = response.status;
    document.querySelector("[data-time]").textContent =
        response.customData.time;
    document.querySelector("[data-size]").textContent = prettyBytes(
        JSON.stringify(response.data).length +
            JSON.stringify(response.headers).length
    );
}

function updateResponseHeaders(headers) {
    responseHeadersContainer.innerHTML = "";

    Object.entries(headers).forEach(([key, value]) => {
        const keyEl = document.createElement("div");
        keyEl.textContent = key;
        responseHeadersContainer.append(keyEl);
        const valEl = document.createElement("div");
        valEl.textContent = value;
        responseHeadersContainer.append(valEl);
    });
}

function createKeyValuePair() {
    const element = keyValueTemplate.content.cloneNode(true);

    element
        .querySelector("[data-remove-btn]")
        .addEventListener("click", (e) => {
            e.target.closest(["[data-key-value-pair]"]).remove();
        });

    return element;
}

function keyValueParisToObject(container) {
    const pairs = container.querySelectorAll("[data-key-value-pair]");
    return [...pairs].reduce((data, pair) => {
        const key = pair.querySelector("[data-key]").value;
        const value = pair.querySelector("[data-value]").value;

        if (key === "") return data;
        return { ...data, [key]: value };
    }, {});
}
