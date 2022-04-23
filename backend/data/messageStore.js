module.exports = Object.freeze({
  types: {
    admin: 'admin',
    agent: 'agent',
    customer: 'customer',
  },

  status: {
    created: 'created',
    active: 'active',
    deleted: 'deleted',
  },

  chat: {
    started: 'started',
    ended: 'ended',
    customerEnded: 'customer_ended',
    deleted: 'deleted',
    timeout: 'timeout',
    systemEnded: 'ended_by_system',
    startFailed: 'start_failed',
    chatPresent: 'chat_present',
    endFailed: 'end_failed',
    resolutionMissing: 'resolution_missing',
    ratingAdded: 'rating_added',
    ratingMissing: 'rating_missing',
    ratingFailed: 'rating_failed',
  },

  resolution: {
    byCustomer: 'chat ended by customer',
    byAgent: 'chat ended by agent',
    systemEnded: 'chat request timed out',
  },

  common: {
    notFound: 'not_found',
    serverError: 'internal_server_error',
  },

  authErrors: {
    adminMissing: 'admin_missing',
    invalidUName: 'username_invalid',
    invalidName: 'name_invalid',
    invalidEmail: 'email_invalid',
    invalidPassword: 'password_invalid',
    incorrectPassword: 'password_incorrect',
    invalidPincode: 'pincode_invalid',
    invalidType: 'type_invalid',
    userExists: 'user_exists',
    deleteFailed: 'delete_failed',
    userNotFound: 'user_not_found',
    verifyFailed: 'verification_failed',
    updateFailed: 'update_failed',
  },

  authSuccess: {
    userAdded: 'user_registered',
    userLogin: 'user_logged_in',
    userDeleted: 'user_deleted',
    passwordUpdated: 'password_updated',
    tokenDeleted: 'token_deleted',
    custDeleted: 'cust_deleted',
    userVerified: 'user_verified',
  },

  chatAlerts: {
    chatWaiting: 'incoming_chat',
    chatDeclined: 'chat_declined',
  },

  msgErrors: {
    presetNotFound: 'preset_not_found',
    presetPresent: 'preset_present',
    presetInvalid: 'preset_invalid',
    sendFailed: 'send_failed',
    sendBlocked: 'send_blocked',
  },

  msgSuccess: {
    presetSaved: 'preset_saved',
    presetList: 'preset_data',
    presetDel: 'preset_deleted',
  },
});
