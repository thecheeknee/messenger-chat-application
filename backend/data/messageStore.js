module.exports = Object.freeze({
  admin: {
    holiday: 'holiday_mode',
    weekend: 'weekend_mode',
    boolean: 'boolean',
    found: 'found'
  },

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
    foundChats: 'chat_found',
    notFound: 'chat_not_found',
  },

  resolution: {
    byCustomer: 'chat ended by customer',
    byAgent: 'chat ended by agent',
    systemEnded: 'chat request timed out',
  },

  rating: {
    notSatisfied: 'notSatisfied',
    satisfied: 'satisfied',
    good: 'good',
    excellent: 'excellent',
  },

  common: {
    notFound: 'not_found',
    serverError: 'internal_server_error',
  },

  authErrors: {
    invalidDetails: 'invalid_details',
    adminMissing: 'admin_missing',
    invalidUName: 'username_invalid',
    invalidName: 'name_invalid',
    invalidEmail: 'email_invalid',
    invalidPassword: 'password_invalid',
    uNameEmailMatch: 'username_email_match',
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
    userDeactivated: 'user_deactivated',
    userDeleted: 'user_deleted',
    userUpdated: 'agent_updated',
    passwordUpdated: 'password_updated',
    tokenDeleted: 'token_deleted',
    custAdded: 'cust_added',
    custDeleted: 'cust_deleted',
    custVerified: 'cust_verified',
    userVerified: 'user_verified',
  },

  chatAlerts: {
    noChats: 'no_chats_present',
    chatWaiting: 'incoming_chat',
    chatDeclined: 'chat_declined',
    weekendFail: 'weekend_check',
    timeFail: 'time_check',
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
    messageSent: 'message_sent',
  },
});
