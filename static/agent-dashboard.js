/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
let chatListScreen,
  chatWindow,
  chatInput,
  incomingRequest,
  presetBlock,
  presetOptions,
  messageJson,
  activeChatId,
  newCustAlert;

class Dashboard {
  constructor(_apiUrl) {
    this._apiUrl = _apiUrl;
    this._get = 'GET';
    this._post = 'POST';
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

  listActiveChats() {
    let activeChatsBlock = ``;
    try {
      activeChatsBlock = `<div class="list-group-item d-flex justify-content-between align-items-start">
        <div class="ms-2 me-auto">
          <div class="fw-bold">Active Chats</div>
        </div>
      </div>`;
      const listChats = this._fetchApi('/list-chat', this._post, {
        status: 'started',
      });

      listChats
        .then((json) => {
          if (json.success && json.message === 'chat_found') {
            const activeChats = json.detail;
            for (let chat in activeChats) {
              activeChatId =
                chat === '0' && !activeChatId
                  ? activeChats[chat]._id
                  : activeChatId;
              activeChatsBlock += this.createChatTag(
                activeChats[chat],
                activeChats[chat].status,
                chat
              );
            }
            chatListScreen.innerHTML = activeChatsBlock;
            if (activeChatId !== '') this.getChatMessages(activeChatId);
          } else throw json.error;
        })
        .catch((error) => {
          console.log(error);
          activeChatsBlock += `<div class="list-group-item">
            <p class="p-2 border-bottom alert alert-warning">No Active Chats</p>
          </div>`;
          chatListScreen.innerHTML = activeChatsBlock;
        });
      this.listInactiveChats();
    } catch (err) {
      activeChatsBlock += `<div class="list-group-item">
        <p class="p-2 border-bottom alert alert-warning">Some error occurred</p>
      </div>`;
      chatListScreen.innerHTML = activeChatsBlock;
    }
  }

  listInactiveChats() {
    // should be called only after activeChats
    try {
      chatListScreen.innerHTML += `<div class="list-group-item d-flex justify-content-between align-items-start">
        <div class="ms-2 me-auto">
          <div class="fw-bold">Inactive Chats</div>
          These chats need to be closed by you!
        </div>
      </div>`;
      const listChats = this._fetchApi('/list-chat', this._post, {
        status: 'customer_ended',
      });

      listChats
        .then((json) => {
          if (json.success && json.message === 'chat_found') {
            const inactiveChats = json.detail;
            for (let chat in inactiveChats) {
              chatListScreen.innerHTML += this.createChatTag(
                inactiveChats[chat],
                inactiveChats[chat].status,
                chat
              );
            }
          } else throw json.error;
        })
        .catch((error) => {
          chatListScreen.innerHTML += `<div class="list-group-item">
            <p class="p-2 border-bottom alert alert-warning">No Pending Chats</p>
            <span class="d-none">${error}</span>
          </div>`;
        });
    } catch (err) {
      chatListScreen.innerHTML += `<div class="list-group-item">
          <p class="p-2 border-bottom alert alert-warning">Some error occurred</p>
        </div>`;
    }
  }

  newCustomerRequest() {
    try {
      const newCust = this._fetchApi('/cust-alert', this._post, {});

      incomingRequest.innerHTML = '';

      newCust
        .then((json) => {
          if (json.success && json.message === 'incoming_chat') {
            const custList = json.detail.verifyList;
            for (let i in custList) {
              incomingRequest.innerHTML += `<div class="alert alert-info mb-2">
                <strong class="alert-heading alert-dismissible fade show" role="alert">New Request!</strong>
                <p>You have a customer waiting for help. Please accept to approve and start the chat!</p>
                <hr>
                <button class="btn btn-success accept-chat" onClick="javascript:verifyCustomer(this);"
                  data-cust-id="${custList[i].custId}"
                  data-cust-name="${custList[i].custUserName}">Accept</button>
                <button class="btn btn-warning" data-bs-dismiss="alert">Ignore</button>
              </div>`;
            }
          } else throw json;
        })
        .catch((err) => {
          // console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  }

  processMessage(sender, senderType, messageData) {
    if (senderType === 'customer') {
      return `
        <div class="d-flex flex-row justify-content-start mb-3 message-blob cust-message">
          <div class="bg-light rounded ps-2 pe-2 pb-1 msg-wrapper">
            <p class="small pt-2 ps-2 mb-0 text-success fw-bold">${sender}</p>
            <p class="small p-2 mb-1">${messageData.text}</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="d-flex flex-row justify-content-end mb-4 pt-1 message-blob agent-message">
          <div class="bg-primary rounded ps-2 pe-2 pb-1 msg-wrapper">
            <p class="small pt-2 ps-2 mb-0 text-light fw-bold">You</p>
            <p class="small p-2 me-3 mb-1 text-white">${messageData.text}</p>
          </div>
        </div>
      `;
    }
  }

  createChatTag(chatDetails, chatStatus, counter) {
    let chatHtml = ``;
    if (chatStatus === 'started') {
      const activeSince =
        new Date().getTime() - new Date(chatDetails.startTime).getTime();

      chatHtml = `
      <a
        href="#!${chatDetails._id}"
        onClick="javascript:getChat(this);"
        data-chat-id="${chatDetails._id}"
        data-chat-customerid="${chatDetails.customerName}"
        data-start-time="${chatDetails.startTime}"
        class="list-group-item chat-tag d-flex justify-content-between align-items-start list-group-item-action ${
          counter === '0' ? 'active' : ''
        }"
        aria-current="true">
        <div class="ms-2 me-auto">
          <div class="fw-bold">${chatDetails.customerName}</div>
          <small>Started ${timeCheck(activeSince)} ago</small>
        </div>
        <span class="badge bg-primary rounded-pill d-none">14</span>
      </a>
      `;
    } else {
      const inactiveSince =
        new Date().getTime() - new Date(chatDetails.startTime).getTime();
      chatHtml = `
      <a
        href="#!${chatDetails._id}"
        onClick="javascript:getChat(this);"
        data-chat-id="${chatDetails._id}"
        data-chat-customerid="${chatDetails.customerName}"
        data-start-time="${chatDetails.startTime}"
        class="list-group-item chat-tag d-flex justify-content-between align-items-start list-group-item-action"
        aria-current="true">
        <div class="ms-2 me-auto">
          <div class="fw-bold">${chatDetails.customerName}</div>
          <small>Inactive ${timeCheck(inactiveSince)} ago</small>
        </div>
        <span class="badge bg-primary rounded-pill d-none">14</span>
      </a>
      `;
    }
    return chatHtml;
  }

  getPresets() {
    try {
      const presetTags = this._fetchApi('/get-presets', this._post, {});
      presetBlock.innerHTML = '';
      presetOptions = {};

      presetTags
        .then((json) => {
          if (json.success && json.message === 'preset_data') {
            const listPresets = json.detail;
            for (let i in listPresets) {
              presetOptions[listPresets[i].tag] =
                listPresets[i].expectedResponse;
              presetBlock.innerHTML += `
                <div class="col-md-4 col-sm-6 mb-3">
                  <button
                    class="btn btn-light border w-100 preset-tag-btn"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="${listPresets[i].message}"
                    data-response="${listPresets[i].responseType}"
                    >${listPresets[i].tag}</button>
                </div>
              `;
            }
            const btns = document.querySelectorAll('.preset-tag-btn');
            btns.forEach((btn) => {
              btn.addEventListener('click', addTemplateMessage, false);
            });
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
          // presetBlock.innerHTML = `<div class="col">
          //   <p class="alert alert-warning">No Presets Found. Please contact Admin!</p>
          // </div>`;
        });
    } catch (error) {
      console.log(error);
    }
  }

  getChatMessages(chatId) {
    try {
      const getMessageList = this._fetchApi(
        '/get-message/' + chatId,
        this._get
      );

      getMessageList
        .then((json) => {
          chatWindow.innerHTML = '';
          if (json.success && json.messageList.length > 0) {
            for (let msg in json.messageList) {
              const message = json.messageList[msg].message;
              const sender = json.messageList[msg].senderName;
              if (userName === sender) {
                chatWindow.innerHTML += this.processMessage(
                  sender,
                  'agent',
                  message
                );
              } else {
                chatWindow.innerHTML += this.processMessage(
                  sender,
                  'customer',
                  message
                );
              }
            }
            activeChatId = chatId;
            if (json.status === 'customer_ended') {
              chatWindow.innerHTML += `<p class="alert alert-warning">Customer has left the chat. Please End the chat</p>`;
            }
            chatInput.removeAttribute('disabled');
            document.getElementById('endChat').removeAttribute('disabled');
            chatInput.querySelector('#messageText').removeAttribute('disabled');
            chatInput
              .querySelector('.btn-outline-secondary')
              .removeAttribute('disabled');
            chatWindow.classList.remove('d-none');
            chatWindow.scrollTop = chatWindow.scrollHeight;
          } else throw json;
        })
        .catch((err) => {
          if (err.status === 'customer_ended') {
            chatWindow.innerHTML += `<p class="alert alert-warning">Customer has left the chat. Please End the chat</p>`;
          } else {
            chatWindow.innerHTML = `<p class="alert alert-warning">Chat Successfully Initiated. Please click on the "Welcome" preset to get started!.</p>`;
          }
          activeChatId = chatId;
          chatInput.removeAttribute('disabled');
          document.getElementById('endChat').removeAttribute('disabled');
          chatInput.querySelector('#messageText').removeAttribute('disabled');
          chatInput
            .querySelector('.btn-outline-secondary')
            .removeAttribute('disabled');
          chatWindow.classList.remove('d-none');
        });
    } catch (error) {
      errorScreen.classList.remove('d-none');
    }
  }

  startNewChat(custId, alertObj) {
    try {
      const verifyData = {
        custId,
      };
      const confirmChat = this._fetchApi(
        '/cust-verify',
        this._post,
        verifyData
      );

      confirmChat
        .then((json) => {
          if (json.success && json.message === 'started') {
            alertObj.closest('.alert-info').remove();
            this.listActiveChats();
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  }

  sendChatMessage(messageData) {
    try {
      let messageInfo = {};
      let apiPath = '';
      if (chatWindow.querySelectorAll('.message-blob').length === 0) {
        messageInfo = {
          chatId: messageData.chatId,
          firstMessage: {
            text: messageData.message,
            expectedResponse: messageData.options,
            responseType: messageData.responseType,
          },
        };
        apiPath = '/initiate-chat';
      } else {
        messageInfo = messageData;
        apiPath = '/send-message';
      }

      const sendNewMessage = this._fetchApi(apiPath, this._post, messageInfo);
      sendNewMessage
        .then((json) => {
          if (json.success && json.message === 'message_sent') {
            if (json.initiated) {
              chatWindow.innerHTML = '';
            }
            clearInput();
            this.getChatMessages(activeChatId);
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  }

  agentEndChat(resolution, chatId) {
    try {
      const endOpts = { resolution, chatId };

      const chatEndedByAgent = this._fetchApi(
        '/agent-end-chat',
        this._post,
        endOpts
      );
      const parent = this;

      chatEndedByAgent
        .then((json) => {
          if (json.success && json.message === 'cust_deleted') {
            chatWindow.innerHTML += `<p class="alert alert-success">Successfully ended chat. Reloading your chats in 10 seconds</p>`;
            chatWindow.scrollTop = chatWindow.scrollHeight;
            setTimeout(relistChats, 10000);
          }
        })
        .catch((err) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  }
}

(function () {
  chatListScreen = document.getElementById('activeChats');
  chatInput = document.getElementById('chatForm');
  chatListScreen = document.getElementById('activeChats');
  incomingRequest = document.getElementById('newCustAlert');
  presetBlock = document.getElementById('presetData');
  chatWindow = document.getElementById('chatRoom');
  chatInput.addEventListener('submit', sendMessage, false);
  const endChatOptions = document.querySelectorAll('.end-chat-btn');
  endChatOptions.forEach((opt) => {
    opt.addEventListener('click', endChatByAgent, false);
  });
  const chats = new Dashboard(apiUrl);
  chats.listActiveChats();
  chats.getPresets();
  newCustAlert = setInterval(checkCustomerRequests, 5000);
})();

function relistChats() {
  const chats = new Dashboard(apiUrl);
  chats.listActiveChats();
}

function checkCustomerRequests() {
  const chats = new Dashboard(apiUrl);
  chats.newCustomerRequest();
}

function timeCheck(diff) {
  let totalSeconds = Math.abs(diff) / 1000;
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds -= days * 86400;

  const hours = Math.floor(totalSeconds / 3600) % 24;
  totalSeconds -= hours * 3600;

  const minutes = Math.floor(totalSeconds / 60) % 60;
  totalSeconds -= minutes * 60;

  return days + ' days ' + hours + ' hours ' + minutes + ' minutes ';
}

function getChat(obj) {
  const chatId = obj.getAttribute('data-chat-id');
  const activeChatTag = document.querySelector('.chat-tag.active');
  if (activeChatTag && activeChatTag !== obj) {
    activeChatTag.classList.remove('active');
  }
  obj.classList.add('active');
  const dashboard = new Dashboard(apiUrl);
  dashboard.getChatMessages(chatId);
}

function verifyCustomer(obj) {
  const custId = obj.getAttribute('data-cust-id');
  const custName = obj.getAttribute('data-cust-name');
  const dashboard = new Dashboard(apiUrl);
  dashboard.startNewChat(custId, obj);
}

function addTemplateMessage(e) {
  if (activeChatId) {
    const tagName = e.target.innerText;
    const tagMessage = e.target.title;
    const tagOptions = presetOptions[tagName];
    const tagResponse = e.target.getAttribute('data-response');
    chatInput.querySelector('#chatMessageInfo p').innerHTML = '';

    chatInput.querySelector('#messageText').value = tagMessage;
    if (tagResponse === 'Options') {
      for (let opt in tagOptions) {
        chatInput.querySelector(
          '#chatMessageInfo p'
        ).innerHTML += `<strong>${opt}</strong> ${tagOptions[opt]} <br/>`;
      }
    }

    chatInput.querySelector('#chatMessageInfo strong').innerText =
      'response type: ' + tagResponse;
    messageJson = {
      senderName: userName,
      chatId: activeChatId,
      message: tagMessage,
      options: tagOptions,
      responseType: tagResponse,
    };
  }
}

function sendMessage(e) {
  if (activeChatId) {
    if (
      e.target.checkValidity() &&
      document.querySelectorAll('.is-invalid').length === 0
    ) {
      if (messageJson === null || messageJson === undefined) {
        messageJson = {
          senderName: userName,
          chatId: activeChatId,
          message: document.getElementById('messageText').value,
          options: {},
          responseType: 'Text',
        };
      } else {
        // ensure text from input goes to user
        messageJson.message = document.getElementById('messageText').value;
      }
      const dashboard = new Dashboard(apiUrl);
      dashboard.sendChatMessage(messageJson);
    }
  }
}

function clearInput() {
  document.getElementById('messageText').value = '';
  chatInput.querySelector('#chatMessageInfo p').innerHTML = '';
  chatInput.querySelector('#chatMessageInfo strong').innerText = '';
  messageJson = null;
}

function endChatByAgent(e) {
  const endBlock = document.getElementById(
    e.target.getAttribute('data-parent')
  );
  const myModal = bootstrap.Modal.getInstance(endBlock);
  if (endBlock && activeChatId) {
    endBlock.querySelector('.alert-warning')?.classList.add('d-none');
    let resolution = '';
    switch (endBlock.id) {
      case 'customerNotResponsiveModal':
        resolution = 'Customer not responsive';
        myModal.hide();
        break;
      case 'customerEndedModal':
        if (
          document.querySelector('input[name="customerEndedOptions"]:checked')
        ) {
          resolution = document.querySelector(
            'input[name="customerEndedOptions"]:checked'
          ).value;
          myModal.hide();
        } else {
          endBlock.querySelector('.alert-warning').classList.remove('d-none');
        }
        break;
      case 'fakeRequestModal':
        if (
          document.querySelector('input[name="fakeRequestOptions"]:checked')
        ) {
          resolution = document.querySelector(
            'input[name="fakeRequestOptions"]:checked'
          ).value;
          myModal.hide();
        } else {
          endBlock.querySelector('.alert-warning').classList.remove('d-none');
        }
        break;
    }
    if (resolution !== '') {
      const dashboard = new Dashboard(apiUrl);
      dashboard.agentEndChat(resolution, activeChatId);
    }
  } else {
    myModal.hide();
  }
}
