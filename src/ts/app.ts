import "../css/globals.css";
import "../css/index.css";

import Password from "./Password";

// util to select elements
const $ = (selector: string) => document.querySelector(selector)!;

const createPasswordRecorder = (parent: string) => {
    const password = new Password({ resolution: 10 });
    $(parent).prepend(password.canvas);
    password.render();

    const [recordButton, stopButton] = [
        ...$(parent).querySelectorAll("button"),
    ];

    recordButton.addEventListener("click", () => {
        password.reset();
        password.record();
        recordButton.disabled = true;
        stopButton.disabled = false;
    });

    stopButton.addEventListener("click", () => {
        password.pause();
        recordButton.disabled = false;
        stopButton.disabled = true;
    });

    return password;
};

const newPassword = createPasswordRecorder(".record-new");
const testPassword = createPasswordRecorder(".record-test");

// test password
document.body.addEventListener("keyup", () => {
    $("#score").innerHTML = newPassword.compare(testPassword).toString();
});
