/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

class Customer {
  constructor(_apiUrl, _chatId) {
    this._apiUrl = _apiUrl;
    this._chatId = _chatId;
    this._get = 'GET';
    this._post = 'POST';
    this._timeout = 60;
    this._custExit = false;
    this._expectedResponse = '';
  }

  async _fetchApi(url, type, data) {
    const fetchUrl = this._apiUrl + url;
    const body = JSON.stringify(data);
    const response = await fetch(fetchUrl, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: type,
      body,
    });
    return await response.json();
  }

  _deleteCookies() {
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
      document.cookie = cookie + '=;expires=' + new Date(0).toUTCString();
    });
  }

  custRegister(name, pincode) {
    try {
      const data = {
        name,
        pincode,
      };

      const _parent = this;

      const custCreate = this._fetchApi('/cust-create', this._post, data);

      custCreate
        .then((json) => {
          if (json.success) {
            _parent.waitForVerification(json.message);
          } else throw json.error;
        })
        .catch((error) => {
          if (error.detail === 'user_exists') {
            waitingScreen.classList.add('d-none');
            alreadyConnectedScreen.classList.remove('d-none');
          } else if (typeof error.detail === Array) {
            waitingScreen.classList.add('d-none');
            let errorList = '';
            error.detail.forEach((element) => {
              errorList += element + '<br/>';
            });
            const errors = newCustForm.querySelector('.alert-warning');
            errors.innerHTML = errorList;
            errors.classList.remove('d-none');
            newCustForm.classList.remove('d-none');
          } else {
            waitingScreen.classList.add('d-none');
            errorScreen.classList.remove('d-none');
          }
        });
    } catch (err) {
      console.log(err);
      waitingScreen.classList.add('d-none');
      errorScreen.classList.remove('d-none');
    }
  }

  waitForVerification(data) {
    try {
      let timer = 0;
      const refreshData = () => {
        const tokenCheck = this._fetchApi('/token', this._get);
        timer = timer + 1;

        tokenCheck
          .then((json) => {
            if (json.success) {
              switch (json.message) {
                case 'cust_verified':
                  // end polling, redirect to chat
                  window.location.pathname = '/chat/' + json.detail._id;
                  break;
                case 'user_verified':
                  // continue polling till timeout or till user clicks on cancel
                  if (this._custExit) {
                    //user has already logged out. Stop the polling
                    waitingScreen.classList.add('d-none');
                    logoutScreen.classList.remove('d-none');
                  } else if (timer === this._timeout) {
                    this.deleteCustomer('system');
                  } else setTimeout(refreshData, 5000);
                  break;
                case 'token_deleted':
                  //stop polling, display logout screen
                  this.deleteCustomer('system');
                  break;
              }
            } else throw json;
          })
          .catch((error) => {
            console.log(error);
            waitingScreen.classList.add('d-none');
            errorScreen.classList.remove('d-none');
          });
      };

      refreshData(); //initiate polling
    } catch (err) {
      console.log(err);
      waitingScreen.classList.add('d-none');
      errorScreen.classList.remove('d-none');
    }
  }

  deleteCustomer(deletedBy = 'user') {
    // delete the customer with /cust-cancel
    try {
      const custDelete = this._fetchApi('/cust-cancel', this._post);

      custDelete
        .then((json) => {
          if (json.success) {
            if (deletedBy === 'system') {
              waitingScreen.classList.add('d-none');
              busyScreen.classList.remove('d-none');
            } else {
              // hide the modal screen
              cancelScreen.hide();
              waitingScreen.classList.add('d-none');
              logoutScreen.classList.remove('d-none');
            }

            this._deleteCookies();
          } else throw json.error;
        })
        .catch((err) => {
          console.log(err);
          waitingScreen.classList.add('d-none');
          errorScreen.classList.remove('d-none');
        });
    } catch (err) {
      console.log(err);
      waitingScreen.classList.add('d-none');
      errorScreen.classList.remove('d-none');
    }
  }

  chatInit() {
    try {
      waitingScreen.classList.remove('d-none');
      const getChat = this._fetchApi('/get-my-chat', this._post, {
        chatId: this._chatId,
      });

      getChat
        .then((json) => {
          if (json.success) {
            chatAgentName = json.detail.agentName;
            chatCustName = json.detail.customerName;
            if (
              json.detail.status === 'customer_ended' ||
              json.detail.status === 'ended'
            ) {
              // chat has already ended. Redirect to home page
              this._deleteCookies();
              window.location.pathname = '/';
            } else if (json.detail.rating !== '0') {
              //customer has already provided rating. Show modal and ask customer to end chat
              document
                .getElementById('ratingSuccess')
                .classList.remove('d-none');
              cancelScreen.querySelector('#goBackToChat').disabled = true;
              cancelScreen
                .querySelector('#terminateChat')
                .addEventListener('click', endChatByUser, false);
              cancelScreen
                .querySelector('#terminateChat')
                .removeAttribute('disabled');
              document.getElementById('endChat').click();
            } else {
              document.getElementById('welcomeMessage').innerText =
                'You are now connected to ' + chatAgentName;
              setTimeout(this.getMessages(this._chatId), 3000);
            }
          }
        })
        .catch((err) => {
          waitingScreen.classList.add('d-none');
          errorScreen.classList.remove('d-none');
        });
    } catch (err) {
      console.log(err);
      waitingScreen.classList.add('d-none');
      errorScreen.classList.remove('d-none');
    }
  }

  getMessages(chatId) {
    // get all messages using the chat ID
    // update customer control based on last message received. (if responseType = options, then block manual input and allow only select option)
    const getMessageList = this._fetchApi('/get-message/' + chatId, this._get);

    getMessageList
      .then((json) => {
        if (json.success) {
          waitingScreen.classList.add('d-none');
          chatScreen.innerHTML = '';
          let counter = json.messageList.length;
          // inputTxt.disabled = true;
          if (counter === 0) {
            chatScreen.innerHTML = `<p class="alert alert-success"> You are connected to ${chatAgentName}. Please wait.</p> `;
          }
          for (let msg in json.messageList) {
            const message = json.messageList[msg].message;
            const sender = json.messageList[msg].senderName;
            if (chatAgentName === sender) {
              //sender is agent
              if (counter === 1) {
                //this is the last message in the list. Modify expected response type
                chatScreen.innerHTML += this.processMessage(
                  sender,
                  'agent',
                  message,
                  true
                );
              } else {
                chatScreen.innerHTML += this.processMessage(
                  sender,
                  'agent',
                  message,
                  false
                );
              }
            } else {
              //sender is customer
              chatScreen.innerHTML += this.processMessage(
                'You',
                'customer',
                message,
                false
              );
            }
            counter--;
          }
          setTimeout(() => {
            const btns = document.querySelectorAll('.option-click');
            btns.forEach((btn) => {
              btn.addEventListener('click', submitOption, false);
            });
            document.getElementById('chatForm').classList.remove('d-none');
            chatScreen.classList.remove('d-none');
            chatScreen.scrollTop = chatScreen.scrollHeight;
          }, 1000);
        } else throw json;
      })
      .catch((err) => {
        console.log(err);
        waitingScreen.classList.add('d-none');
        errorScreen.classList.remove('d-none');
      });
  }

  processMessage(sender, senderType, messageData, process) {
    if (senderType === 'customer') {
      inputTxt.removeAttribute('disabled');
      inputTxt.setAttribute('type', 'text');
      return `
          <div class="d-flex flex-row justify-content-end mb-4 pt-1 cust-message">
            <div class="rounded ps-2 pe-2 pb-1 msg-wrapper">
              <p class="small pt-2 ps-2 mb-0 text-secondary fw-bold">${sender}</p>
              <p class="small p-2 me-3 mb-1 text-dark">${messageData.text}</p>
            </div>
          </div>
        `;
    } else {
      if (process) {
        let optionsHtml = ``;
        this._expectedResponse = messageData.responseType;
        switch (this._expectedResponse.toLowerCase()) {
          case 'options':
            inputTxt.disabled = true;
            var keySet = Object.keys(messageData.options);
            for (let key in keySet) {
              optionsHtml += `
                  <button type="button"
                  class="btn btn-outline-dark option-click"
                  onClick="submitOption"
                  data-id="${keySet[key]}"
                  data-value="${messageData.options[keySet[key]]}">
                    ${messageData.options[keySet[key]]}
                  </button>
                `;
            }
            break;
          case 'number':
            inputTxt.removeAttribute('disabled');
            inputTxt.setAttribute('type', 'number');
            break;
          case 'text':
          default:
            inputTxt.removeAttribute('disabled');
            inputTxt.setAttribute('type', 'text');
        }
        return `
            <div class="d-flex flex-row justify-content-start mb-3 agent-message">
              <div class="rounded ps-2 pe-2 pb-1 msg-wrapper">
                <p class="small pt-2 ps-2 mb-0 text-success fw-bold">${sender}</p>
                <p class="small p-2 mb-1">${messageData.text}</p>
              </div>
            </div>
            <div class="mt-2 mb-3 options-wrapper">${optionsHtml}</div>
          `;
      } else {
        return `
            <div class="d-flex flex-row justify-content-start mb-3 agent-message">
              <div class="rounded ps-2 pe-2 pb-1 msg-wrapper">
                <p class="small pt-2 ps-2 mb-0 text-success fw-bold">${sender}</p>
                <p class="small p-2 mb-1">${messageData.text}</p>
              </div>
            </div>
          `;
      }
    }
  }

  sendMessage(message, id = '') {
    let verified = true;
    if (
      chatScreen.querySelector('.options-wrapper') !== undefined &&
      this._expectedResponse === 'options'
    ) {
      const btnCheck = chatScreen.querySelector('[data-id="' + id + '"]');
      if (
        btnCheck &&
        btnCheck.classList.contains('option-click') &&
        btnCheck.getAttribute('data-value') === message
      ) {
        chatScreen.querySelector('.options-wrapper').remove();
      } else {
        verified = false;
      }
    } else if (this._expectedResponse === 'text' && message === '') {
      verified = false;
    } else if (this._expectedResponse === 'number' && !/\d/.test(value)) {
      verified = false;
    }

    if (verified) {
      const msgData = {
        senderName: chatCustName,
        chatId: this._chatId,
        message: message,
        options: {},
        responseType: '',
      };

      try {
        const sendMessage = this._fetchApi(
          '/send-message',
          this._post,
          msgData
        );

        sendMessage
          .then((json) => {
            if (json.success) {
              inputTxt.value = '';
              this.getMessages(this._chatId);
            }
          })
          .catch((err) => {
            console.log(err);
            errorScreen.classList.remove('d-none');
          });
      } catch (error) {
        console.log(err);
        errorScreen.classList.remove('d-none');
      }
    }
  }

  setRating(option) {
    try {
      const ratingData = {
        rating: option,
      };
      const sendRating = this._fetchApi('/rate-chat', this._post, ratingData);

      sendRating
        .then((json) => {
          if (json.success) {
            inputTxt.disabled = true;
            // user has to end chat. Remove escape options
            document.getElementById('ratingSuccess').classList.remove('d-none');
            cancelScreen.querySelector('.btn-close').disabled = true;
            cancelScreen.querySelector('#goBackToChat').disabled = true;
            cancelScreen
              .querySelector('#terminateChat')
              .addEventListener('click', endChatByUser, false);
            cancelScreen
              .querySelector('#terminateChat')
              .removeAttribute('disabled');
          }
        })
        .catch((err) => {
          console.log(err);
          errorScreen.classList.remove('d-none');
        });
    } catch (error) {
      console.log(error);
      errorScreen.classList.remove('d-none');
    }
  }

  endChatByCustomer() {
    try {
      const chatInfo = {
        chatId: this._chatId,
      };
      const endChat = this._fetchApi('/cust-end-chat', this._post, chatInfo);

      endChat
        .then((json) => {
          if (json.success) {
            window.location.pathname = '/logout';
          }
        })
        .catch((err) => {
          console.log(err);
          cancelScreen.querySelector('.btn-close').removeAttribute('disabled');
          cancelScreen
            .querySelector('#goBackToChat')
            .removeAttribute('disabled');
          cancelScreen.querySelector('#terminateChat').disabled = true;
          cancelScreen.hide();
        });
    } catch (error) {
      console.log(error);
      cancelScreen.querySelector('.btn-close').removeAttribute('disabled');
      cancelScreen.querySelector('#goBackToChat').removeAttribute('disabled');
      cancelScreen.querySelector('#terminateChat').disabled = true;
      cancelScreen.hide();
    }
  }
}

let newCustForm,
  chatScreen,
  waitingScreen,
  alreadyConnectedScreen,
  busyScreen,
  errorScreen,
  logoutScreen,
  cancelScreen,
  inputTxt,
  ratingOpt;
var chatCustName, chatAgentName;

(function () {
  const pathValue = window.location.pathname.split('/')[1];
  switch (pathValue) {
    case '':
      newCustForm = document.getElementById('newCustomer');
      waitingScreen = document.getElementById('waiting');
      alreadyConnectedScreen = document.getElementById('alreadyConnected');
      busyScreen = document.getElementById('busy');
      errorScreen = document.getElementById('error');
      logoutScreen = document.getElementById('logout');
      cancelScreen = document.getElementById('cancelChatModal');
      document
        .getElementById('name')
        .addEventListener('change', validate, false);
      document
        .getElementById('pincode')
        .addEventListener('change', validate, false);
      document
        .getElementById('custCancel')
        .addEventListener('click', cancelChatRequest, false);
      newCustForm.addEventListener('submit', customerRegister, false);
      break;
    case 'chat':
      var cust = new Customer(apiUrl, chatId);
      waitingScreen = document.getElementById('waiting');
      chatScreen = document.getElementById('messagesBlock');
      inputTxt = document.getElementById('messageText');
      errorScreen = document.getElementById('error');
      ratingOpt = document.getElementsByName('rating');
      cancelScreen = document.getElementById('endChatModal');
      ratingOpt.forEach((opt) => {
        opt.addEventListener('change', ratingClicked, false);
      });
      document
        .getElementById('chatForm')
        .addEventListener('submit', submitMessage, false);
      cust.chatInit();
      break;
    case 'logout':
    default:
      newCustForm = document.getElementById('newCustomer');
      waitingScreen = document.getElementById('waiting');
      logoutScreen = document.getElementById('logout');
      newCustForm.classList.add('d-none');
      waitingScreen.classList.add('d-none');
      logoutScreen.classList.remove('d-none');
      break;
  }
})();

function submitOption(e) {
  e.preventDefault();
  e.stopPropagation();
  const btn = e.target;
  const cust = new Customer(apiUrl, chatId);
  cust.sendMessage(btn.getAttribute('data-value'), btn.getAttribute('data-id'));
}

function submitMessage(e) {
  e.stopPropagation();
  e.preventDefault();
  if (inputTxt.value !== '') {
    const cust = new Customer(apiUrl, chatId);
    cust.sendMessage(inputTxt.value);
  }
}

function ratingClicked(e) {
  const cust = new Customer(apiUrl, chatId);
  cust.setRating(e.target.id);
}

function endChatByUser(e) {
  const cust = new Customer(apiUrl, chatId);
  cust.endChatByCustomer();
}

function validate(e) {
  const key = e.target;
  const value = e.target.value;
  switch (key.id) {
    case 'name':
      if (/\d/.test(value) || value.length < 3 || value.length > 30)
        key.classList.add('is-invalid');
      else key.classList.remove('is-invalid');
      break;
    case 'pincode':
      if (!/\d/.test(value) || value.length !== 6)
        key.classList.add('is-invalid');
      else key.classList.remove('is-invalid');
      break;
  }
}

function cancelChatRequest(e) {
  const cust = new Customer(apiUrl, chatId);
  cust._custExit = true;
  cust.deleteCustomer('user');
}

function customerRegister(e) {
  if (
    e.target.checkValidity() &&
    document.querySelectorAll('.is-invalid').length === 0
  ) {
    e.preventDefault();
    e.stopPropagation();

    let nameInput = document.getElementById('name');
    let pincodeInput = document.getElementById('pincode');

    const customerName = nameInput.value.replace(/\s/g, '');
    const customerPincode = pincodeInput.value;

    waitingScreen.querySelector('#customerName').innerText = customerName;
    waitingScreen.querySelector('#customerPincode').innerText = customerPincode;

    waitingScreen.classList.remove('d-none');
    newCustForm.classList.add('d-none');

    const cust = new Customer(apiUrl, chatId);
    cust.custRegister(customerName, customerPincode);
  } else {
    return false;
  }
}
