const hamburgerButton = document.getElementById("hamburger");
const navList = document.getElementById("nav-list");
function toggleButton() {
  navList.classList.toggle("show");
}
hamburgerButton.addEventListener("click", toggleButton);
const heroElement = document.querySelector(".hero");
const switchElement = document.querySelector(".switch");
switchElement.addEventListener("click", () => {
  heroElement.classList.toggle("light");
});
