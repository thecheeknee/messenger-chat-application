/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
let adminChatAgents,
  adminChatList,
  adminChatHistory,
  adminPresetList,
  adminPresetForm,
  adminAgentList,
  adminAgentForm;
let currentAgent,
  currentAgentName,
  currentChat,
  presetOptionsStore,
  presetFetched,
  currentPreset,
  currentTab,
  usersFetched;

class AdminDashboard {
  constructor(apiUrl) {
    this._apiUrl = apiUrl;
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

  listAllAgents(verifyStatus, sourceAction) {
    let affectedSection =
      currentTab === 'chatMaster' ? adminChatAgents : adminAgentList;
    try {
      let dataObj = {
        verified: false,
        status: 'created',
      };
      switch (verifyStatus) {
        case 'new':
          dataObj.verified = false;
          dataObj.status = 'created';
          break;
        case 'active':
          dataObj.verified = true;
          dataObj.status = 'active';
          break;
        case 'inactive':
          dataObj.verified = false;
          dataObj.status = 'deleted';
          break;
      }

      const listAgents = this._fetchApi('/user-list', this._post, dataObj);

      listAgents
        .then((json) => {
          affectedSection.innerHTML = '';
          if (json.success && json.detail.count > 0) {
            for (let agent in json.detail.listAgents) {
              agent = parseInt(agent);
              if (agent === 0) {
                currentAgent = json.detail.listAgents[agent]._id;
                currentAgentName = json.detail.listAgents[agent].name;
              }
              affectedSection.innerHTML += this.createAgentTag(
                json.detail.listAgents[agent],
                sourceAction
              );
            }
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
          affectedSection.innerHTML = `<p class="alert alert-warning">No Agents Found</p>`;
        })
        .finally(() => {
          if (
            currentAgent &&
            affectedSection.querySelector('.agent-tag') !== null
          ) {
            affectedSection.querySelectorAll('.agent-tag')[0].click();
          }
        });
    } catch (error) {
      console.log(error);
      affectedSection.innerHTML = `<p class="alert alert-warning">No Agents Found</p>`;
    }
  }

  listAgentChats(agentId, chatStatus) {
    try {
      const chatData = {
        agentId: agentId,
        status: chatStatus,
      };
      const getChats = this._fetchApi(
        '/list-agent-chats',
        this._post,
        chatData
      );

      getChats
        .then((json) => {
          adminChatList.innerHTML = '';
          adminChatHistory.innerHTML = '';
          if (json.success && json.message === 'chat_found') {
            for (let chat in json.detail) {
              chat = parseInt(chat);
              adminChatList.innerHTML += this.createChatTag(json.detail[chat]);
            }
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
          let chatDisplay = '';
          switch (chatStatus) {
            case 'started':
              chatDisplay = 'New / Ongoing';
              break;
            case 'customer_ended':
              chatDisplay = 'Pending Resolution';
              break;
            case 'ended':
              chatDisplay = 'Completed';
              break;
          }
          adminChatList.innerHTML = `<p class="alert alert-warning">No ${chatDisplay} chats found for this agent</p>`;
        });
    } catch (error) {
      console.log(error);
      adminChatList.innerHTML = `<p class="alert alert-warning">No chats found for this agent</p>`;
    }
  }

  getChatMessages(chatId, resolution) {
    try {
      const getMessageList = this._fetchApi(
        '/get-message/' + chatId,
        this._get
      );

      getMessageList
        .then((json) => {
          (currentChat = chatId), (adminChatHistory.innerHTML = '');
          if (json.success) {
            if (json.messageList.length > 0) {
              for (let msg in json.messageList) {
                const messageBlock = json.messageList[msg];
                const message = messageBlock.message;
                const sender = messageBlock.senderName;
                let messageHtml = `
                  <div class="list-group-item ${
                    sender === currentAgentName
                      ? 'agent-message'
                      : 'customer-message'
                  }">
                    <strong class="text-success">${sender}</strong>
                    <p class="mb-0">${message.text}</p>
                    <small class="text-muted">${messageBlock.createdAt}</small>
                  </div>`;
                adminChatHistory.innerHTML += messageHtml;
              }
              if (resolution !== '') {
                adminChatHistory.innerHTML += `<p class="m-3 alert alert-info">${resolution}</p>`;
              }
            } else {
              adminChatHistory.innerHTML += `<p class="m-3 alert alert-info">${resolution}</p>`;
            }
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
          adminChatHistory.innerHTML = `<p class="m-3 alert alert-warning">No Chat Data Found.</p>`;
        });
    } catch (error) {
      console.log(error);
      adminChatHistory.innerHTML = `<p class="m-3 alert alert-warning">No Chat Data Found.</p>`;
    }
  }

  deleteChatMessagesUser(chatId) {
    try {
      const deleteData = this._fetchApi('/delete-invalid-chat', this._post, {
        chatId,
      });

      deleteData
        .then((json) => {
          if (json.success) {
            const chatStatus = document.getElementById('chatStatus').value;
            this.listAgentChats(currentAgent, chatStatus);
          } else {
            throw json;
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  }

  listPresets() {
    try {
      const getPresets = this._fetchApi('/get-presets', this._post);

      getPresets
        .then((json) => {
          if (
            json.success &&
            json.message === 'preset_data' &&
            json.detail.length > 0
          ) {
            presetOptionsStore = {};
            presetFetched = true;
            adminPresetList.innerHTML = '';
            for (let preset in json.detail) {
              preset = parseInt(preset);
              presetOptionsStore[json.detail[preset].tag] =
                json.detail[preset].expectedResponse;
              adminPresetList.innerHTML += `
              <a href="#!preset-${json.detail[preset].tag}"
                data-id="${json.detail[preset]._id}"
                data-tag="${json.detail[preset].tag}"
                data-response="${json.detail[preset].responseType}"
                data-message="${json.detail[preset].message}"
                data-sequence="${json.detail[preset].sequence}"
                class="list-group-item list-group-item-action preset-tag" onClick="getPresetDetails(this);">
                <div class="d-flex w-100 justify-content-between">
                  <strong class="mb-1">${json.detail[preset].tag}</strong>
                  <small class="text-muted">${json.detail[preset].responseType}</small>
                </div>
                <p class="mb-1 preset-message"><em>${json.detail[preset].message}</em></p>
              </a>
              `;
            }
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
          adminPresetList.innerHTML = `<p class="alert alert-warning">No presets found. Please add a preset to get started!</p>`;
        });
    } catch (error) {
      console.log(err);
      adminPresetList.innerHTML = `<p class="alert alert-warning">No presets found. Please add a preset to get started!</p>`;
    }
  }

  savePreset(tagName, tagMessage, tagType, tagOptions, seqValue) {
    try {
      const tagDetails = {
        tag: tagName,
        message: tagMessage,
        type: tagType,
        responseData: tagOptions,
        sequence: seqValue,
      };

      const tagUpdate = this._fetchApi('/save-tag', this._post, tagDetails);

      tagUpdate
        .then((json) => {
          if (json.success) {
            document.getElementById('presetSuccess').classList.remove('d-none');
            this.listPresets();
          } else throw json;
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  }

  deletePresetTag(tagName) {
    try {
      const tagDelete = this._fetchApi('/delete-tag', this._post, {
        tag: tagName,
      });

      tagDelete
        .then((json) => {
          if (json.success) {
            this.listPresets();
            document.getElementById('newPreset').click();
          } else throw json;
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (err) {
      console.log(err);
    }
  }

  verifyAgent(agentId) {
    try {
      const agentVerify = this._fetchApi('/user-verify', this._post, {
        agentId: agentId,
      });

      agentVerify
        .then((json) => {
          if (json.success) {
            document.getElementById('agentActionSuccess').innerText =
              'User verified successfully.';
            document
              .getElementById('agentActionSuccess')
              .classList.remove('d-none');
            resetUserData();
          } else throw json;
        })
        .catch((err) => {
          document.getElementById('agentActionFailure').innerText =
            'User verification failed. error details:' + err;
          document
            .getElementById('agentActionFailure')
            .classList.remove('d-none');
        })
        .finally(() => {
          const verifyModal = bootstrap.Modal.getInstance(
            document.getElementById('verifyUserModal')
          );
          verifyModal.hide();
        });
    } catch (err) {
      document.getElementById('agentActionFailure').innerText =
        'User verification failed. error details:' + err;
      document.getElementById('agentActionFailure').classList.remove('d-none');
    }
  }

  updateAgent(agentId, name, password, emailId) {
    try {
      const agentDetails = {
        agentId,
        name,
        password,
        emailId,
      };
      const agentUpdate = this._fetchApi(
        '/user-update',
        this._post,
        agentDetails
      );

      agentUpdate
        .then((json) => {
          if (json.success) {
            document.getElementById('agentActionSuccess').innerText =
              'User updated successfully';
            document
              .getElementById('agentActionSuccess')
              .classList.remove('d-none');
            resetUserData();
          } else throw json;
        })
        .catch((err) => {
          document.getElementById('agentActionFailure').innerText =
            'User verification failed. error details:' + err;
          document
            .getElementById('agentActionFailure')
            .classList.remove('d-none');
        })
        .finally(() => {
          const updateModal = bootstrap.Modal.getInstance(
            document.getElementById('updateUserModal')
          );
          updateModal.hide();
        });
    } catch (err) {
      document.getElementById('agentActionFailure').innerText =
        'User verification failed. error details:' + err;
      document.getElementById('agentActionFailure').classList.remove('d-none');
    }
  }

  deleteAgent(agentId, adminPassword) {
    try {
      const agentDetails = {
        agentId,
        adminPassword,
      };

      const agentDel = this._fetchApi('/user-delete', this._post, agentDetails);

      agentDel
        .then((json) => {
          if (json.success) {
            if (json.message === 'user_deleted') {
              document.getElementById('agentActionSuccess').innerText =
                'Unverified Agent Deleted Successfully';
            }
            if (json.message === 'user_deactivated') {
              document.getElementById('agentActionSuccess').innerText =
                'Agent Successfully Deactivated';
            }
            document
              .getElementById('agentActionSuccess')
              .classList.remove('d-none');
            resetUserData();
          } else throw json;
        })
        .catch((err) => {
          document.getElementById('agentActionFailure').innerText =
            'User verification failed. error details:' + err;
          document
            .getElementById('agentActionFailure')
            .classList.remove('d-none');
        })
        .finally(() => {
          const deleteModal = bootstrap.Modal.getInstance(
            document.getElementById('deleteUserModal')
          );
          deleteModal.hide();
        });
    } catch (err) {
      document.getElementById('agentActionFailure').innerText =
        'User verification failed. error details:' + err;
      document.getElementById('agentActionFailure').classList.remove('d-none');
    }
  }

  createAgentTag(agentData, clickAction) {
    return `
      <a href="#!agent-${agentData._id}"
        data-id="${agentData._id}"
        data-username="${agentData.userName}"
        data-name="${agentData.name}"
        data-email="${agentData.email}"
        data-status="${agentData.status}"
        data-rating="${agentData.totalRating}/5"
        data-chats="${agentData.totalChats}"
        class="list-group-item list-group-item-action agent-tag"
        onClick="${clickAction.name}(this)">
        <div class="d-flex w-100 justify-content-between">
          <h6 class="mb-1 agent-name">${agentData.name}</h6>
          <small class="text-muted">${agentData.status}</small>
        </div>
        <p class="mb-1"><em>${agentData.email}</em></p>
        <small class="text-muted">${agentData.totalRating}/5</small>
      </a>
    `;
  }

  createChatTag(chatData) {
    return `
    <a href="#!chat-${chatData._id}"
      data-id="${chatData._id}"
      onClick="getChatDetails(this)"
      class="list-group-item list-group-item-action chat-data">
      <div class="d-flex w-100 justify-content-between">
        <p class="mb-1">${chatData.customerName}</p>
        <small class="text-muted">${chatData.rating}</small>
      </div>
      <p class="mb-1 chat-resolution"><em>${chatData.resolution}</em></p>
      <small class="text-muted">${chatData.status}</small>
    </a>
    `;
  }
}

(function () {
  adminChatAgents = document.getElementById('activeAgentsList');
  adminChatList = document.getElementById('agentChatList');
  adminChatHistory = document.getElementById('chatDetails');
  adminPresetList = document.getElementById('presetList');
  adminPresetForm = document.getElementById('presetUpdateForm');
  adminAgentList = document.getElementById('agentsList');
  adminAgentForm = document.getElementById('agentUpdateForm');
  currentTab = document
    .querySelectorAll('a.page-tab')[0]
    .getAttribute('data-id');
  document
    .getElementById('deleteChat')
    .addEventListener('click', deleteChatData, false);
  document.querySelectorAll('a.page-tab').forEach((link) => {
    link.addEventListener('click', changeTab, false);
  });
  adminPresetForm.addEventListener('submit', presetSave, false);
  document
    .getElementById('newPreset')
    .addEventListener('click', createNewPreset, false);
  document
    .getElementById('verifyUser')
    .addEventListener('click', verifySelectedAgent, false);
  document
    .getElementById('updateUser')
    .addEventListener('click', updateSelectedAgent, false);
  document
    .getElementById('deleteUser')
    .addEventListener('click', deleteSelectedAgent, false);
  document
    .getElementById('deletePreset')
    .addEventListener('click', deleteMarkedPreset, false);
  var admin = new AdminDashboard(apiUrl);
  admin.listAllAgents('active', getChatsByAgent);
})();

function changeTab(e) {
  e.preventDefault();
  const link = document.getElementById(e.target.id);
  if (!link.classList.contains('active')) {
    const oldLink = document.querySelector('.active.text-dark');
    const oldTab = document.querySelector('.tab-data.current');
    oldLink.classList.remove('active', 'text-dark');
    oldLink.classList.add('text-white');
    oldLink.removeAttribute('aria-current');
    oldTab.classList.remove('current');
    oldTab.classList.add('d-none');

    link.classList.remove('text-white');
    link.classList.add('active', 'text-dark');
    link.setAttribute('aria-current', 'page');
    currentTab = link.getAttribute('data-id');
    const newTab = document.getElementById(currentTab);
    newTab.classList.remove('d-none');
    newTab.classList.add('current');

    const admin = new AdminDashboard(apiUrl);

    switch (currentTab) {
      case 'presetMaster':
        if (!presetFetched) admin.listPresets();
        break;
      case 'userMaster':
        if (!usersFetched) {
          usersFetched = true;
          admin.listAllAgents('new', getUserDetails);
        }
        break;
      case 'chatMaster':
      default:
        break;
    }
  }
}

function getChatsByAgent(tag) {
  currentAgent = tag.getAttribute('data-id');
  currentAgentName = tag.querySelector('.agent-name').innerText.trim();
  var admin = new AdminDashboard(apiUrl);
  const chatStatus = document.getElementById('chatStatus').value;
  admin.listAgentChats(currentAgent, chatStatus);
}

function getChatsByType(selectTag) {
  var admin = new AdminDashboard(apiUrl);
  const chatStatus = selectTag.value;
  admin.listAgentChats(currentAgent, chatStatus);
}

function getChatDetails(chatTag) {
  var admin = new AdminDashboard(apiUrl);
  const chatId = chatTag.getAttribute('data-id');
  const resolution = chatTag.querySelector('.chat-resolution').innerText.trim();
  admin.getChatMessages(chatId, resolution);
}

function getPresetDetails(presetTag) {
  if (!presetTag.classList.contains('active')) {
    document.getElementById('optionsBlockAlert').classList.add('d-none');
    document.getElementById('deletePreset').removeAttribute('disabled');
    const oldTag = document.querySelector('#presetList .active');
    if (oldTag) oldTag.classList.remove('active');
    presetTag.classList.add('active');
    adminPresetForm.reset();
    const tagOptions = presetOptionsStore[presetTag.getAttribute('data-tag')];
    currentPreset = presetTag.getAttribute('data-id');
    document.getElementById('presetTagName').value =
      presetTag.getAttribute('data-tag');
    document.getElementById('presetMessage').value =
      presetTag.getAttribute('data-message');
    const tagTypes = document.getElementById('presetResponseType');
    tagTypes.value = presetTag.getAttribute('data-response');

    document
      .getElementById('deletePresetModal')
      .querySelector('.alert-danger .alert-heading').innerText =
      'Preset Name: ' + presetTag.getAttribute('data-tag');
    document
      .getElementById('deletePresetModal')
      .querySelector('.alert-danger p').innerText =
      presetTag.getAttribute('data-message');

    document.getElementById('presetSequence').value = parseInt(
      presetTag.getAttribute('data-sequence')
    );
    if (presetTag.getAttribute('data-response') === 'Options') {
      document.getElementById('optionsWrapper').classList.remove('d-none');
      document.getElementById('optionsBlock').innerHTML = '';
      for (let opt in tagOptions) {
        document.getElementById('optionsBlock').innerHTML += `
        <div class="row option-block" data-id="${opt}">
          <button type="button" class="btn-close delete-option" aria-label="Close" onClick="removeOption(this);"></button>
          <div class="col-sm-4">
            <label for="presetTagName" class="form-label">Option Name</label>
            <input type="text" class="form-control options-title" value="${opt}">
            <div class="form-text">A short name to identify your option</div>
          </div>
          <div class="col-sm-8">
            <label for="presetTagName" class="form-label">Option Value</label>
            <input type="text" class="form-control options-message" value="${tagOptions[opt]}">
            <div class="form-text">Value displayed to the user</div>
          </div>
        </div>
        `;
      }
    } else {
      document.getElementById('optionsBlock').innerHTML = '';
      document.getElementById('optionsWrapper').classList.add('d-none');
    }
  }
}

function createNewPreset(e) {
  e.preventDefault();
  currentPreset = '';
  document
    .getElementById('deletePresetModal')
    .querySelector('.alert-danger .alert-heading').innerText = '';
  document
    .getElementById('deletePresetModal')
    .querySelector('.alert-danger p').innerText = '';
  document.getElementById('deletePreset').setAttribute('disabled', true);
  const oldTag = document.querySelector('#presetList .active');
  if (oldTag) oldTag.classList.remove('active');

  adminPresetForm.reset();
  document.getElementById('presetSuccess').classList.add('d-none');
  document.getElementById('optionsBlock').innerHTML = '';
}

function setResponseType(responseTag) {
  const responseType = responseTag.value;
  switch (responseType) {
    case 'Text':
    case 'Number':
    case 'EndChat':
      document.getElementById('optionsBlock').innerHTML = '';
      document.getElementById('optionsWrapper').classList.add('d-none');
      break;
    case 'Options':
      document.getElementById('optionsWrapper').classList.remove('d-none');
      break;
  }
}

function addOption(btnTag) {
  if (document.querySelectorAll('.option-block').length <= 5) {
    const newOption = `
    <div class="row option-block">
      <button type="button" class="btn-close delete-option" aria-label="Close" onClick="removeOption(this);"></button>
      <div class="col-sm-4">
        <label for="presetTagName" class="form-label">Option Name</label>
        <input type="text" class="form-control options-title">
        <div class="form-text">A short name to identify your option</div>
      </div>
      <div class="col-sm-8">
        <label for="presetTagName" class="form-label">Option Value</label>
        <input type="text" class="form-control options-message">
        <div class="form-text">Value displayed to the user</div>
      </div>
    </div>
    `;
    document
      .getElementById('optionsBlock')
      .insertAdjacentHTML('beforeend', newOption);
  } else {
    document.getElementById('optionsBlockAlert').classList.remove('d-none');
  }
}

function removeOption(btnTag) {
  document.getElementById('optionsBlockAlert').classList.add('d-none');
  btnTag.parentNode.remove();
}

function presetSave(e) {
  if (e.target.checkValidity()) {
    let validity = [];
    const tagName = document.getElementById('presetTagName');
    if (
      !/^[A-Za-z ]+$/.test(tagName.value) ||
      tagName.value.length < 3 ||
      tagName.value.length > 30
    ) {
      validity.push('tag name invalid');
    }
    const tagType = document.getElementById('presetResponseType');
    let tagOptionData = {};
    if (tagType.value === 'Options') {
      const tagOptons = document.querySelectorAll('.option-block');
      if (!tagOptons || tagOptons.length < 2)
        validity.push('tag options not present');
      tagOptons.forEach((opt, index) => {
        if (
          opt.querySelector('.options-title').value === '' ||
          opt.querySelector('.options-message').value === ''
        ) {
          validity.push('tag option ' + (index + 1) + ' not valid');
        } else {
          const tagOptName = opt
            .querySelector('.options-title')
            .value.toLowerCase()
            .replace(/ /g, '-');
          const tagOptMessage = opt.querySelector('.options-message').value;
          tagOptionData[tagOptName] = tagOptMessage;
        }
      });
    }
    const tagMessage = document.getElementById('presetMessage');
    if (tagMessage.value === '' || tagMessage.value.length < 10) {
      validity.push('tag message invalid');
    }
    const seqValue = parseInt(document.getElementById('presetSequence').value);

    if (validity.length > 0) {
      document
        .getElementById('presetValidateErrors')
        .querySelector('p').innerHTML = validity.join('<br/>');
      document
        .getElementById('presetValidateErrors')
        .classList.remove('d-none');
    } else {
      document.getElementById('presetValidateErrors').classList.add('d-none');
      const admin = new AdminDashboard(apiUrl);
      admin.savePreset(
        tagName.value,
        tagMessage.value,
        tagType.value,
        tagOptionData,
        seqValue
      );
    }
  }
}

function deleteMarkedPreset() {
  if (currentPreset) {
    const tagName = document.getElementById('presetTagName').value;

    const admin = new AdminDashboard(apiUrl);
    admin.deletePresetTag(tagName);
  }
}

function getAgentsByStatus(agentTag) {
  var admin = new AdminDashboard(apiUrl);
  const agentStatus = agentTag.value;
  admin.listAllAgents(agentStatus, getUserDetails);
}

function getUserDetails(tag) {
  if (adminAgentList.querySelector('a.agent-tag.active')) {
    adminAgentList
      .querySelector('a.agent-tag.active')
      .classList.remove('active');
  }
  tag.classList.add('active');
  document.getElementById('agentActionSuccess').classList.add('d-none');
  currentAgent = tag.getAttribute('data-id');
  document.getElementById('agentIdInput').value = currentAgent;
  document.getElementById('agentUNameInput').value =
    tag.getAttribute('data-username');
  document.getElementById('agentNameInput').value =
    tag.getAttribute('data-name');
  document.getElementById('agentEmailInput').value =
    tag.getAttribute('data-email');
  document.getElementById('totalChatCount').innerText =
    tag.getAttribute('data-chats');
  document.getElementById('totalRating').innerText =
    tag.getAttribute('data-rating');
  document.getElementById('agentPassword').value = '';
  const agentStatus = tag.getAttribute('data-status');
  let displayStatus = '';
  switch (agentStatus) {
    case 'created':
      displayStatus = 'new';
      document.getElementById('verifyModalBtn').removeAttribute('disabled');
      document.getElementById('updateModalBtn').setAttribute('disabled', true);
      document.getElementById('deleteModalBtn').removeAttribute('disabled');
      break;
    case 'active':
      displayStatus = 'active';
      document.getElementById('verifyModalBtn').setAttribute('disabled', true);
      document.getElementById('updateModalBtn').removeAttribute('disabled');
      document.getElementById('deleteModalBtn').removeAttribute('disabled');
      break;
    case 'deleted':
      displayStatus = 'inactive';
      document.getElementById('verifyModalBtn').removeAttribute('disabled');
      document.getElementById('updateModalBtn').setAttribute('disabled', true);
      document.getElementById('deleteModalBtn').setAttribute('disabled', true);
      break;
  }
  document.getElementById('agentStatusInput').value = displayStatus;
}

function verifySelectedAgent() {
  if (
    currentAgent &&
    currentAgent === document.getElementById('agentIdInput').value &&
    (document.getElementById('agentStatusInput').value === 'new' ||
      document.getElementById('agentStatusInput').value === 'inactive')
  ) {
    const admin = new AdminDashboard(apiUrl);
    admin.verifyAgent(currentAgent);
  }
}

function updateSelectedAgent() {
  if (
    currentAgent &&
    currentAgent === document.getElementById('agentIdInput').value &&
    document.getElementById('agentStatusInput').value === 'active'
  ) {
    const admin = new AdminDashboard(apiUrl);
    admin.updateAgent(
      document.getElementById('agentIdInput').value,
      document.getElementById('agentNameInput').value,
      document.getElementById('agentPassword').value,
      document.getElementById('agentEmailInput').value
    );
  }
}

function deleteSelectedAgent() {
  if (
    currentAgent &&
    currentAgent === document.getElementById('agentIdInput').value &&
    document.getElementById('agentStatusInput').value !== 'inactive'
  ) {
    const admin = new AdminDashboard(apiUrl);
    admin.deleteAgent(
      currentAgent,
      document.getElementById('adminPassword').value
    );
  }
}

function resetUserData() {
  adminAgentForm.reset();
  currentAgent = '';
}

function deleteChatData(e) {
  if (currentAgent && currentChat) {
    var admin = new AdminDashboard(apiUrl);
    admin.deleteChatMessagesUser(currentChat);
  }
}
