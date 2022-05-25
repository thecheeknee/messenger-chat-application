/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
let loginScreen,
  waitingScreen,
  errorScreen,
  notVerifiedScreen,
  notFoundScreen,
  adminMissingScreen,
  logoutSuccess,
  logoutFail;

class Account {
  constructor(_apiUrl) {
    this._serverApiUrl = _apiUrl;
    this._get = 'GET';
    this._post = 'POST';
  }

  _fetchApi(url, type, data) {
    const fetchUrl = this._serverApiUrl + url;

    const body = JSON.stringify(data);
    return fetch(fetchUrl, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: type,
      body,
    }).then((response) => {
      return response.json();
    });
  }

  registerNewAccount(
    userName,
    name,
    email,
    type,
    password,
    confirmPassword,
    adminName
  ) {
    try {
      const accountInfo = {
        userName,
        name,
        email,
        type,
        password,
        confirmPassword,
        adminName,
      };

      const addUser = this._fetchApi('/user-register', this._post, accountInfo);

      addUser
        .then((json) => {
          if (json.success) {
            waitingScreen.classList.add('d-none');
            if (json.detail === 'agent') {
              notVerifiedScreen.classList.remove('d-none');
            }
            if (json.detail === 'admin') {
              waitingScreen.classList.add('d-none');
              setTimeout(() => {
                window.location.pathname = '/admin-dashboard';
              }, 5000);
            }
          } else throw json;
        })
        .catch((err) => {
          const errorCode =
            err.error.code === 'internal_server_error'
              ? err.error.detail
              : err.error.code;
          waitingScreen.classList.add('d-none');
          switch (errorCode) {
            case 'admin_missing':
              adminMissingScreen.classList.remove('d-none');
              break;
            case 'user_exists':
              notFoundScreen.classList.remove('d-none');
              break;
            case 'invalid_details':
              errorScreen.querySelector('.alert-warning').innerHTML =
                err.error.detail.join('<br/>');
              errorScreen.classList.remove('d-none');
              break;
            case 'type_invalid':
            default:
              errorScreen.classList.remove('d-none');
              break;
          }
        });
    } catch (error) {
      console.log(error);
      errorScreen.classList.remove('d-none');
    }
  }

  loginToDashboard(email, password, type, userName = '') {
    try {
      const loginData = {
        email,
        password,
        userName,
        type,
      };
      const loginCheck = this._fetchApi('/user-login', this._post, loginData);

      loginCheck
        .then((json) => {
          if (json.success) {
            waitingScreen.classList.add('d-none');
            if (json.detail === 'agent') {
              // redirect to agent dashboard
              window.location.pathname = '/agent-dashboard';
            }
            if (json.detail === 'admin') {
              //redirect to admin dashboard
              window.location.pathname = '/admin-dashboard';
            }
          } else throw json;
        })
        .catch((err) => {
          const errorCode =
            err.error.code === 'internal_server_error'
              ? err.error.detail
              : err.error.code;
          waitingScreen.classList.add('d-none');
          switch (errorCode) {
            case 'verification_failed':
              notVerifiedScreen.classList.remove('d-none');
              break;
            case 'user_not_found':
              notFoundScreen.classList.remove('d-none');
              break;
            case 'password_invalid':
            case 'invalid_details':
            default:
              errorScreen.classList.remove('d-none');
              break;
          }
        });
    } catch (error) {
      console.log(error);
      errorScreen.classList.remove('d-none');
    }
  }

  updateMyDetails(userDetails) {
    try {
      const userUpdate = this._fetchApi(
        '/update-my-details',
        this._post,
        userDetails
      );

      userUpdate
        .then((json) => {
          if (json.success) {
            document.getElementById('agentActionSuccess').innerText =
              'Details updated successfully.';
            document
              .getElementById('agentActionSuccess')
              .classList.remove('d-none');
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  }

  logoutAccount() {
    try {
      const loginCheck = this._fetchApi('/user-logout', this._post, {});

      loginCheck
        .then((json) => {
          if (json.success) {
            logoutSuccess.classList.remove('d-none');
          } else {
            logoutFail.classList.remove('d-none');
          }
        })
        .catch((error) => {
          console.log(error);
          logoutFail.classList.remove('d-none');
        });
    } catch (err) {
      console.log(err);
      logoutSuccess.classList.remove('d-none');
    }

    clearCookies();
    setTimeout(() => {
      window.location.hash = '';
      window.location.pathname = '/login';
    }, 5000);
  }
}

(function () {
  const pathname = window.location.pathname.split('/')[1];
  switch (pathname) {
    case 'login':
      loginScreen = document.getElementById('loginScreen');
      waitingScreen = document.getElementById('waiting');
      errorScreen = document.getElementById('error');
      notVerifiedScreen = document.getElementById('verifyPending');
      notFoundScreen = document.getElementById('notFound');
      document
        .getElementById('accEmail')
        .addEventListener('change', validate, false);
      document
        .getElementById('accType')
        .addEventListener('change', validate, false);
      document
        .getElementById('adminUserName')
        .addEventListener('change', validate, false);
      document
        .getElementById('staffLogin')
        .addEventListener('submit', staffLoginAccount, false);
      clearCookies();
      break;
    case 'account-register':
      loginScreen = document.getElementById('register');
      waitingScreen = document.getElementById('waiting');
      errorScreen = document.getElementById('error');
      notVerifiedScreen = document.getElementById('verifyPending');
      adminMissingScreen = document.getElementById('adminMissing');
      notFoundScreen = document.getElementById('notFound');
      document
        .getElementById('accUserName')
        .addEventListener('change', validate, false);
      document
        .getElementById('accName')
        .addEventListener('change', validate, false);
      document
        .getElementById('accEmail')
        .addEventListener('change', validate, false);
      document
        .getElementById('accRegType')
        .addEventListener('change', validate, false);
      document
        .getElementById('accPassword')
        .addEventListener('change', validate, false);
      document
        .getElementById('accConfirmPassword')
        .addEventListener('change', validate, false);
      document
        .getElementById('adminUserName')
        .addEventListener('change', validate, false);
      document
        .getElementById('staffLogin')
        .addEventListener('submit', staffRegisterNew, false);
      clearCookies();
      break;
    case 'personal-info':
      document
        .getElementById('accountUpdateForm')
        .addEventListener('submit', updatePersonalDetails, false);
      document
        .getElementById('backToDashboard')
        .addEventListener('click', goToDashboard, false);
      document
        .getElementById('accName')
        .addEventListener('change', validate, false);
      document
        .getElementById('accEmail')
        .addEventListener('change', validate, false);
      document
        .getElementById('accPassword')
        .addEventListener('change', validate, false);
      document
        .getElementById('accPassword')
        .addEventListener('change', validate, false);
      document
        .getElementById('accConfirmPassword')
        .addEventListener('change', validate, false);
      document
        .getElementById('logoutAccount')
        .addEventListener('click', startLogout, false);
      break;
    case 'agent-dashboard':
    case 'admin-dashboard':
      errorScreen = document.getElementById('errorMessage');
      chatWindow = document.getElementById('chatRoom');
      logoutSuccess = document.getElementById('logoutSuccess');
      logoutFail = document.getElementById('logoutFail');
      document
        .getElementById('personalDetails')
        .addEventListener('click', showPersonalDetails, false);
      document
        .getElementById('logoutAccount')
        .addEventListener('click', startLogout, false);
      break;
    default:
      break;
  }
})();

function clearCookies() {
  const cookies = document.cookie.split(';');
  cookies.forEach((cookie) => {
    document.cookie = cookie + '=;expires=' + new Date(0).toUTCString();
  });
}

function validate(e) {
  const key = e.target;
  const value = e.target.value;
  switch (key.id) {
    case 'accUserName':
      if (!/^[a-zA-Z0-9]{6,20}$/.test(value)) key.classList.add('is-invalid');
      else key.classList.remove('is-invalid');
      break;
    case 'accName':
      if (!/^[a-zA-Z ]{6,30}$/.test(value)) key.classList.add('is-invalid');
      else key.classList.remove('is-invalid');
      break;
    case 'accEmail':
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value))
        key.classList.add('is-invalid');
      else key.classList.remove('is-invalid');
      break;
    case 'accRegType':
      if (value === 'admin') {
        document.getElementById('adminUserName').removeAttribute('required');
        document.getElementById('adminUserName').value = '';
        document
          .getElementById('adminUserName')
          .parentNode.classList.add('d-none');
      } else {
        document.getElementById('adminUserName').setAttribute('required', true);
        document
          .getElementById('adminUserName')
          .parentNode.classList.remove('d-none');
      }
      break;
    case 'accType':
      if (value === 'admin') {
        document.getElementById('adminUserName').setAttribute('required', true);
        document
          .getElementById('adminUserName')
          .parentNode.classList.remove('d-none');
      } else {
        document.getElementById('adminUserName').removeAttribute('required');
        document.getElementById('adminUserName').value = '';
        document
          .getElementById('adminUserName')
          .parentNode.classList.add('d-none');
      }
      break;
    case 'accOldPassword':
      if (value === '') key.classList.add('is-invalid');
      else key.classList.remove('is-invalid');
      break;
    case 'accPassword':
      if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(value))
        key.classList.add('is-invalid');
      else {
        key.classList.remove('is-invalid');
      }
      if (value != '' && document.getElementById('passwordChangeAlert')) {
        document
          .getElementById('passwordChangeAlert')
          .classList.remove('d-none');
      } else if (
        value === '' &&
        document.getElementById('passwordChangeAlert')
      ) {
        document.getElementById('passwordChangeAlert').classList.add('d-none');
      }
      break;
    case 'accConfirmPassword':
      if (
        /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(value) &&
        value === document.getElementById('accPassword').value
      )
        key.classList.remove('is-invalid');
      else key.classList.add('is-invalid');
      break;
    case 'adminUserName':
      if (value === '') key.classList.add('is-invalid');
      else key.classList.remove('is-invalid');
      break;
  }
}

function staffLoginAccount(e) {
  if (
    e.target.checkValidity() &&
    document.querySelectorAll('.is-invalid').length === 0
  ) {
    e.preventDefault();
    e.stopPropagation();

    const email = document.getElementById('accEmail').value;
    const type = document.getElementById('accType').value;
    const userName = document.getElementById('adminUserName').value;
    const password = document.getElementById('accPassword').value;

    loginScreen.classList.add('d-none');
    waitingScreen.classList.remove('d-none');

    const acc = new Account(apiUrl);
    acc.loginToDashboard(email, password, type, userName);
  } else return false;
}

function staffRegisterNew(e) {
  if (
    e.target.checkValidity() &&
    document.querySelectorAll('.is-invalid').length === 0
  ) {
    e.preventDefault();
    e.stopPropagation();

    const userName = document.getElementById('accUserName').value;
    const name = document.getElementById('accName').value;
    const email = document.getElementById('accEmail').value;
    const type = document.getElementById('accRegType').value;
    const password = document.getElementById('accPassword').value;
    const confirmPassword = document.getElementById('accConfirmPassword').value;
    const adminName = document.getElementById('adminUserName').value;

    loginScreen.classList.add('d-none');
    waitingScreen.classList.remove('d-none');

    const acc = new Account(apiUrl);
    acc.registerNewAccount(
      userName,
      name,
      email,
      type,
      password,
      confirmPassword,
      adminName
    );
  }
}

function showPersonalDetails() {
  window.location.hash = '';
  window.location.pathname = '/personal-info';
}

function updatePersonalDetails(e) {
  document.getElementById('agentActionFailure').classList.add('d-none');
  // if user enters new password, then check for new password and confirm password
  if (
    e.target.checkValidity() &&
    document.querySelectorAll('.is-invalid').length === 0
  ) {
    e.preventDefault();
    e.stopPropagation();

    let updatedDetails;
    if (
      document.getElementById('accName').value != accountDetails.name ||
      document.getElementById('accEmail').value != accountDetails.email
    ) {
      // name or email ID has been changed
      updatedDetails = {
        name: document.getElementById('accName').value,
        email: document.getElementById('accEmail').value,
        password: document.getElementById('accOldPassword').value,
      };
    }

    const newPassword = document.getElementById('accPassword').value;
    const confirmPassword = document.getElementById('accConfirmPassword').value;

    if (
      newPassword &&
      confirmPassword &&
      newPassword === confirmPassword &&
      newPassword.length > 6
    ) {
      updatedDetails = {
        password: document.getElementById('accOldPassword').value,
        newPassword,
        confirmPassword,
      };
    }

    if (updatedDetails) {
      const acc = new Account(apiUrl);
      acc.updateMyDetails(updatedDetails);
    } else {
      document.getElementById('agentActionFailure').innerText =
        'No changes found.';
      document.getElementById('agentActionFailure').classList.remove('d-none');
    }
  }
}

function goToDashboard(e) {
  const type = e.target.getAttribute('data-type');
  const redirection =
    type === 'admin' ? '/admin-dashboard' : '/agent-dashboard';
  window.location.pathname = redirection;
}

function startLogout(e) {
  const pathname = window.location.pathname.split('/')[1];
  if (pathname === 'agent-dashboard') {
    var activeChats = new bootstrap.Modal(
      document.getElementById('logoutModal')
    );
    if (
      document.getElementById('activeChats').querySelectorAll('li').length > 0
    ) {
      activeChats.show();
      return false;
    }
  }
  const acc = new Account(apiUrl);
  acc.logoutAccount();
}
