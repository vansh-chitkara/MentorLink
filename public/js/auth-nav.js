(function () {
  function getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  function getUserRaw() {
    return localStorage.getItem("user") || sessionStorage.getItem("user");
  }

  function syncStorage(token, userRaw) {
    if (token) {
      if (!localStorage.getItem("token")) localStorage.setItem("token", token);
      if (!sessionStorage.getItem("token")) sessionStorage.setItem("token", token);
    }
    if (userRaw) {
      if (!localStorage.getItem("user")) localStorage.setItem("user", userRaw);
      if (!sessionStorage.getItem("user")) sessionStorage.setItem("user", userRaw);
    }
  }

  function setLoggedOut(navButtons, navUser, navLogout) {
    if (navButtons) {
      const fallback = navButtons.dataset.authDisplay || "flex";
      navButtons.style.display = fallback;
    }
    if (navUser) navUser.textContent = "";
    if (navLogout) navLogout.style.display = "none";
  }

  function setLoggedIn(navButtons, navUser, navLogout, userName) {
    if (navButtons) navButtons.style.display = "none";
    if (navUser) navUser.textContent = userName || "My Account";
    if (navLogout) navLogout.style.display = "inline-block";
  }

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.replace("/signup");
  }

  try {
    const navButtons = document.getElementById("navButtons");
    const navUser = document.getElementById("navUser");
    const navLogout = document.getElementById("navLogout");

    if (!navButtons && !navUser && !navLogout) {
      return;
    }

    if (navButtons && !navButtons.dataset.authDisplay) {
      const computed = window.getComputedStyle(navButtons).display;
      navButtons.dataset.authDisplay = computed === "none" ? "flex" : computed;
    }

    const token = getToken();
    const userRaw = getUserRaw();

    if (!token) {
      setLoggedOut(navButtons, navUser, navLogout);
      return;
    }

    syncStorage(token, userRaw);

    let user = null;
    try {
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch (_) {
      user = null;
    }

    setLoggedIn(navButtons, navUser, navLogout, user && user.name ? user.name : "My Account");

    if (navLogout) {
      navLogout.onclick = doLogout;
    }
  } catch (_) {
    // Keep page usable even if auth nav script fails.
  }
})();
