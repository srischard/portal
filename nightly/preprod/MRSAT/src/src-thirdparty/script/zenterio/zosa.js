var Zosa = (function() {
  function ZosaRequest(zosa, logger)
  {
    var that = this;
    var log = logger;
    var zosa = zosa;
    var onSuccess = function (event) { log.trace("request success"); };
    var onFailure = function (event) { log.error("request failure"); };
    var onAlways = function (event) { log.trace("request finished"); };
    this._prepareResponse = function (response) { return response; };
    this.cancel = function () { zosa._cancelRequest(that.requestId); };
    this.success = function(func)
    {
      onSuccess = func;
      return that;
    };
    this.failure = function(func)
    {
      onFailure = func;
      return that;
    };
    this.always = function(func)
    {
      onAlways = func;
      return that;
    };
    this._fireSuccess = function (event) {
      if (onSuccess != null) {
        try {
          event.response = that._prepareResponse(event.response);
          onSuccess(event);
        }
        catch (e) {
          log.exception(e);
        }
        that._fireAlways(event);
      }
    };
    this._fireFailure = function (event) {
      if (onFailure != null) {
        try {
          onFailure(event);
        }
        catch (e) {
          log.exception(e);
        }
        that._fireAlways(event);
      }
    };
    this._fireAlways = function(event) {
      if (onAlways != null) {
        try {
          onAlways(event);
        }
        catch (e) {
          log.exception(e);
        }
      }
    };
  }
  function ZosaPlaybackSession(zosa, sessionId, mediaUrl, usageRestrictions,
                               lastPlaybackPosition, alternativeStreamSelected,
                               selectedStream, selectedStreamReason, customProps)
  {
    var that = this;
    var zosa = zosa;
    var sessionId = sessionId;
    var onStopPlayback = function (event) { log.trace("session stop playback"); };
    var onUpdateCur = function (event) { log.trace("session update content usage restrictions"); };
    function prepareCurSegment(segment) {
      segment.disableAnalogOutput = (segment.flags & (1 << 1)) != 0;
      segment.disableTrickplayBuffering = (segment.flags & (1 << 2)) != 0;
      segment.disableJumpDuringPlayback = (segment.flags & (1 << 3)) != 0;
      segment.forceAnalogDownscaling = (segment.flags & (1 << 4)) != 0;
      segment.disableTrickplayPause = (segment.flags & (1 << 6)) != 0;
      segment.disableTrickplayRewind = (segment.flags & (1 << 7)) != 0;
      segment.disableTrickplayFastForward = (segment.flags & (1 << 8)) != 0;
      segment.disableJumpForwardDuringPlayback = (segment.flags & (1 << 10)) != 0;
      segment.disableJumpBackwardsDuringPlayback = (segment.flags & (1 << 11)) != 0;
      delete segment.flags;
    }
    function prepareCur(cur)
    {
      if (cur && cur.segments) {
        cur.segments.forEach(prepareCurSegment);
        return cur;
      }
      return null;
    }
    this.mediaUrl = mediaUrl;
     this.usageRestrictions = prepareCur(usageRestrictions);
     this.lastPlaybackPosition = lastPlaybackPosition;
     this.alternativeStreamSelected = alternativeStreamSelected;
     this.selectedStreamReason = selectedStreamReason;
     this.selectedStream = selectedStream;
     this.customProps = customProps;
   
    this.setOnStopPlayback = function(func)
    {
      onStopPlayback = func;
      return that;
    };
    this.setOnUpdateCur = function(func)
    {
      onUpdateCur = func;
      return that;
    };
    this.setOnUpdateCustomProperties = function(func)
    {
     onUpdateCustomProperties = func;
      return that;
    };
    this.storePlaybackPosition = function(params)
    {
      log.trace("storePlaybackPosition");
      if (!params) { params = { }; }
      return zosa._storePlaybackPosition(sessionId, params.position);
    }
    this.destroy = function(params)
    {
      return zosa._destroyPlaybackSession(sessionId);
    };
    this._fireOnStopPlayback = function(event)
    {
      if (onStopPlayback != null) {
        try {
          onStopPlayback(event);
        }
        catch (e) {
          log.exception(e);
        }
      }
    };
    this._fireOnUpdateCur = function(cur)
    {
      if (onUpdateCur != null) {
        try {
          onUpdateCur(prepareCur(cur));
        }
        catch (e) {
          log.exception(e);
        }
      }
    };
    this._fireOnUpdateCustomProperties = function(customProps)
    {
      if (onUpdateCustomProperties != null) {
        try {
         onUpdateCustomProperties(customProps);
        }
        catch (e) {
          log.exception(e);
        }
      }
    };
  }
  function ZosaProgramsUpdatedObserver(zosa, observerId)
  {
    var that = this;
    var zosa = zosa;
    var onProgramsUpdated = function (event) { log.trace("programs updated"); };
    var observerId = observerId;
    this.destroy = function(params)
    {
      return zosa.destroyProgramsUpdatedObserver(observerId);
    };
    this.setOnProgramsUpdated = function(func)
    {
      onProgramsUpdated = func;
      return that;
    };
    this._fireOnProgramsUpdated = function(event)
    {
      if (onProgramsUpdated != null) {
        try {
          onProgramsUpdated(event);
        }
        catch (e) {
          log.exception(e);
        }
      }
    };
  }
  function ZosaError()
  {
    this.code = "";
    this.message = "";
  }
  function ZosaServiceProviderSessionError()
  {
    this.serviceProviderId = null;
  }
  function ZosaRequestResponseEvent()
  {
    this.response = null;
  }
  function ZosaErrorEvent()
  {
    this.error = null;
  }
  function ZosaRequestMessage(action, requestId)
  {
    this.action = action;
    this.requestId = requestId;
  }
  ZosaRequestMessage.prototype.toString = function()
  {
    return JSON.stringify(this);
  };
  function toItemId(item)
  {
    if (item != null && typeof item === 'object' && "zosaId" in item) {
      return item.zosaId;
    }
    return item;
  }
  function toItemIds(elementList)
  {
    var elements = elementList;
    if (typeof elementList === 'object' && "elements" in elementList) {
      elements = elementList.elements;
    }
    var zosaIds = [];
    for (var i = 0; i < elements.length; ++i) {
      zosaIds[i] = toItemId(elements[i]);
    }
    return zosaIds;
  }
  function toItemTime(time)
  {
    if (typeof time === 'number') {
      return time;
    }
    else if (time instanceof Date) {
      return time.valueOf();
    }
    return undefined;
  }
  function Zosa()
  {
    var _protocol = (function() {
        var ProtocolInfo = {
            VERSION: "0.9.1"
        };
        var RequestFields = {
            ACTION: "action",
            REQUEST_ID: "requestId",
            RESPONSE: "response",
            ERROR: "error"
        };
        var ItemTypes = {
            SERVICE_PROVIDER_ITEM: "ServiceProviderItem",
            CHANNEL_ITEM: "ChannelItem",
            CHANNEL_STREAM_ITEM: "ChannelStreamItem",
            PROGRAM_ITEM: "ProgramItem",
            VOD_ITEM: "VodItem",
            CATEGORY_ITEM: "CategoryItem",
            GENRE_ITEM: "GenreItem",
            PROFILE_ITEM: "ProfileItem",
            REMINDER_ITEM: "ReminderItem",
            MESSAGE_ITEM: "MessageItem",
            RECORDING_ITEM: "RecordingItem",
            SUB_RECORDING_ITEM: "SubRecordingItem",
            PARENT_RECORDING_ITEM: "ParentRecordingItem",
            DEVICE_ITEM: "DeviceItem",
            FAVORITE_LIST_ITEM: "FavoriteListItem",
            OFFER_ITEM: "OfferItem",
            TICKET_ITEM: "TicketItem",
            MEDIA_PERSON_ITEM: "MediaPersonItem",
            STREAM_ITEM: "StreamItem",
            VAS_ITEM: "VasItem",
            BANDWIDTH_BOOKING_ITEM: "BandwidthBookingItem"
        };
        var ItemFields = {
            ZOSA_ID: "zosaId",
            ZOSA_TYPE: "zosaType",
            TITLE: "title",
            ICON: "icon"
        };
        var RecordingSpaceType = {
            RECORDING_SPACE_TYPE_UNDEFINED: 0,
            RECORDING_SPACE_TYPE_CLIENT: 1,
            RECORDING_SPACE_TYPE_NETWORK: 2
        };
        var DeviceType = {
            DEVICE_TYPE_UNKNOWN: 0,
            DEVICE_TYPE_STB: 1,
            DEVICE_TYPE_OTT: 2,
            DEVICE_TYPE_PC: 3
        };
        var ProfileType = {
            PROFILE_TYPE_ADMIN: 0,
            PROFILE_TYPE_USER: 1
        };
        var PasswordType = {
            PASSWORD_TYPE_SUBSCRIBER: 0,
            PASSWORD_TYPE_ADMIN: 1,
            PASSWORD_TYPE_PARENTAL: 2,
            PASSWORD_TYPE_PURCHASE: 3,
            PASSWORD_TYPE_PROFILE: 4,
            PASSWORD_TYPE_ADULT: 5
        };
        var SearchFilterType = {
            SEARCH_FILTER_INCLUDE: 0,
            SEARCH_FILTER_ONLY: 1,
            SEARCH_FILTER_EXCLUDE: 2
        };
        var ZosaSortDirection = {
            SORT_DIRECTION_ASCENDING: 0,
            SORT_DIRECTION_DESCENDING: 1
        };
        var ZosaAudioChannel = {
            AUDIO_CHANNEL_STEREO: 0,
            AUDIO_CHANNEL_MULTICHANNEL: 1,
            AUDIO_CHANNEL_MONO: 2,
            AUDIO_CHANNEL_MONO_LEFT: 3,
            AUDIO_CHANNEL_MONO_RIGHT: 4,
            AUDIO_CHANNEL_DUAL_MONO: 5,
            AUDIO_CHANNEL_JOINT_STEREO: 6
        };
        var ZosaAudioSupplementary = {
            SUPPLEMENTARY_NORMAL: 0,
            SUPPLEMENTARY_AUDIO_DESCRIPTION: 1,
            SUPPLEMENTARY_SPOKEN_SUBTITLING: 2,
            SUPPLEMENTARY_CLEAN_AUDIO: 3,
            SUPPLEMENTARY_AUDIO_OTHER: 4,
            SUPPLEMENTARY_AUDIO_WITH_PARAMETRIC_DATA: 5,
            SUPPLEMENTARY_HARD_OF_HEARING_SUBTITLING: 6
        };
        var ZosaChannelType = {
            CHANNEL_TYPE_TV: 0,
            CHANNEL_TYPE_RADIO: 1,
            CHANNEL_TYPE_APPLICATION: 2
        };
        var TransmissionType = {
            TRANSMISSION_TYPE_UNKNOWN: 0,
            TRANSMISSION_TYPE_DVB_C: 1,
            TRANSMISSION_TYPE_DVB_S: 2,
            TRANSMISSION_TYPE_DVB_T: 3,
            TRANSMISSION_TYPE_DVB_C2: 4,
            TRANSMISSION_TYPE_DVB_S2: 5,
            TRANSMISSION_TYPE_DVB_T2: 6,
            TRANSMISSION_TYPE_ISDB_C: 7,
            TRANSMISSION_TYPE_ISDB_S: 8,
            TRANSMISSION_TYPE_ISDB_T: 9,
            TRANSMISSION_TYPE_ATSC_T: 10,
            TRANSMISSION_TYPE_ATSC_C: 11,
            TRANSMISSION_TYPE_IPTV: 12
        };
        var ZosaAudioCodecType = {
            CODEC_NONE: 0,
            CODEC_PCM: 4096,
            CODEC_MP2: 4097,
            CODEC_MP3: 4098,
            CODEC_DTS: 4099,
            CODEC_AC3: 4100,
            CODEC_EAC3: 4101,
            CODEC_AAC: 4102,
            CODEC_HEAAC: 4103,
            CODEC_HEAAC_ADTS: 4104,
            CODEC_HEAAC_V2: 4105,
            CODEC_HEAAC_V2_ADTS: 4106
        };
        var ZosaVideoAspectRatio = {
            ASPECT_RATIO_4_3: 0,
            ASPECT_RATIO_16_9: 1,
            ASPECT_RATIO_GREATER_THAN_16_9: 2
        };
        var ZosaSortAttribute = {
            SORT_ATTRIBUTE_START_TIME: 0,
            SORT_ATTRIBUTE_NAME: 1,
            SORT_ATTRIBUTE_AVAILABILITY_START_TIME: 2,
            SORT_ATTRIBUTE_COLLECT_TIME: 3,
            SORT_ATTRIBUTE_LAST_PLAYBACK_TIME: 4,
            SORT_ATTRIBUTE_DURATION: 5
        };
        var VodType = {
            VOD_TYPE_NORMAL: 0,
            VOD_TYPE_SERIES: 1,
            VOD_TYPE_SEASON: 2
        };
        var VasType = {
            VAS_TYPE_OTHER: 0,
            VAS_TYPE_APP: 1
        };
        var ParticipantType = {
            PARTICIPANT_TYPE_OTHER: 0,
            PARTICIPANT_TYPE_ACTOR: 1,
            PARTICIPANT_TYPE_DIRECTOR: 2,
            PARTICIPANT_TYPE_PRODUCER: 3,
            PARTICIPANT_TYPE_SINGER: 4,
            PARTICIPANT_TYPE_WRITER: 5
        };
        var SearchQueryFields = {
            TITLE: "title",
            ACTOR: "actor",
            DIRECTOR: "director",
            CAST: "cast",
            KEYWORD: "keyword",
            GENRE: "genre"
        };
        SearchQueryFields.ItemFields = ItemFields;
        var EventFields = {
            EVENT_TYPE: "eventType"
        };
        var EventTypes = {
            REMINDER: "Reminder",
            RECORDING_CHANGED: "RecordingChanged",
            PLAYBACK_SESSION_STOPPED: "PlaybackSessionStopped",
            CUR_UPDATED: "CURUpdated",
            PLAYBACK_SESSION_CUSTOM_PROPERTIES_UPDATED: "PlaybackSessionCustomPropertiesUpdated",
            MESSAGE: "Message",
            DATA_UPDATED: "DataUpdated",
            SERVICE_PROVIDER_SESSION_ERROR: "ServiceProviderSessionError",
            CUSTOM_API: "CustomApi",
            PARENTAL_BLOCKING_CHANGED: "ParentalBlockingChanged",
            RECORDING_BANDWIDTH_CONFLICT: "RecordingBandwidthConflict",
            PROGRAMS_UPDATED: "ProgramsUpdated"
        };
        var PlaybackSessionPropertyNames = {
            SELECTED_STREAM_ID: "selectedStreamId",
            SELECTED_STREAM_REASON: "selectedStreamReason",
            SELECTED_STREAM_DEFINITION: "selectedStreamDefinition",
            ALTERNATIVE_STREAM_SELECTED: "alternativeStreamSelected",
            PREFERRED_STREAM_DEFINITION: "preferredStreamDefinition"
        };
        var CgmsaType = {
            COPY_FREELY: 0,
            COPY_NO_MORE: 1,
            COPY_ONCE: 2,
            COPY_NEVER: 3
        };
        var MacrovisionType = {
            OFF: 0,
            AGC: 1,
            AGC_2_STRIPE: 2,
            AGC_4_STRIPE: 3
        };
        var ZosaDigitalContentProtectionType = {
            NONE: 0,
            OPTIONAL: 1,
            MANDATORY_HD: 2,
            MANDATORY: 3
        };
        var HdcpVersionType = {
            HDCP_NOT_APPLICABLE: -1,
            HDCP_NOT_ENGAGED: 0,
            HDCP_1_0: 10,
            HDCP_1_1: 11,
            HDCP_1_2: 12,
            HDCP_1_3: 13,
            HDCP_1_4: 14,
            HDCP_2_0: 20,
            HDCP_2_1: 21,
            HDCP_2_2: 22
        };
        var Actions = {
            ZOSA_LOGIN: "zosaLogin",
            ZOSA_LOGOUT: "zosaLogout",
            SERVICE_PROVIDER_LOGIN: "serviceProviderLogin",
            SERVICE_PROVIDER_LOGOUT: "serviceProviderLogout",
            GET_SERVICE_PROVIDERS: "getServiceProviders",
            GET_CHANNELS: "getChannels",
            GET_PROGRAMS: "getPrograms",
            GET_OTHER_INSTANCES: "getOtherInstances",
            GET_CATEGORIES: "getCategories",
            GET_GENRES: "getGenres",
            GET_VODS: "getVods",
            GET_REMINDERS: "getReminders",
            ADD_REMINDER: "addReminder",
            REMOVE_REMINDERS: "removeReminders",
            CLEAR_REMINDERS: "clearReminders",
            GET_RECORDINGS: "getRecordings",
            GET_PARENT_RECORDINGS: "getParentRecordings",
            UPDATE_RECORDING: "updateRecording",
            UPDATE_PARENT_RECORDING: "updateParentRecording",
            REMOVE_RECORDINGS: "removeRecordings",
            GET_RECORDING_CONFLICTS: "getRecordingConflicts",
            SCHEDULE_INTERVAL_RECORDING: "scheduleIntervalRecording",
            SCHEDULE_PROGRAM_RECORDING: "scheduleProgramRecording",
            UPDATE_RECORDING_CONFLICT: "updateRecordingConflict",
            DELETE_MARKED_RECORDING_CONFLICTS: "deleteMarkedRecordingConflicts",
            GET_NEXT_RECORDING_CONFLICT: "getNextRecordingConflict",
            AUTO_SOLVE_RECORDING_CONFLICTS: "autoSolveRecordingConflicts",
            GET_RECORDING_SPACE_INFO: "getRecordingSpaceInfo",
            GET_DEVICES: "getDevices",
            UPDATE_DEVICE: "updateDevice",
            GET_FAVORITE_LISTS: "getFavoriteLists",
            REMOVE_PROFILE: "removeProfile",
            ADD_PROFILE: "addProfile",
            MODIFY_PROFILE: "modifyProfile",
            SWITCH_PROFILE: "switchProfile",
            GET_CURRENT_PROFILE: "getCurrentProfile",
            GET_PROFILES: "getProfiles",
            GET_RATING_SYSTEMS: "getRatingSystems",
            GET_LANGUAGES: "getSupportedLanguages",
            ADD_FAVORITES: "addFavorites",
            REMOVE_FAVORITES: "removeFavorites",
            CLEAR_FAVORITES: "clearFavorites",
            SORT_FAVORITES: "sortFavorites",
            VALIDATE_PASSWORD: "validatePassword",
            CHANGE_PASSWORD: "changePassword",
            RESET_PASSWORD: "resetPassword",
            SEARCH: "search",
            GET_OFFERS: "getOffers",
            GET_ALLOWED_STATUS: "getAllowedStatus",
            SUBSCRIBE_OFFER: "subscribeOffer",
            UNSUBSCRIBE_OFFER: "unsubscribeOffer",
            CREATE_PLAYBACK_SESSION: "createPlaybackSession",
            DESTROY_PLAYBACK_SESSION: "destroyPlaybackSession",
            RELEASE_BANDWIDTH_BOOKINGS: "releaseBandwidthBookings",
            STORE_PLAYBACK_POSITION: "storePlaybackPosition",
            GET_TICKETS: "getTickets",
            GET_RECOMMENDATIONS: "getRecommendations",
            GET_MEDIA_PERSONS: "getMediaPersons",
            REPORT_USAGE_EVENT: "reportUsageEvent",
            SET_CHANNEL_ATTRIBUTES: "setChannelAttributes",
            GET_CHANNEL_ATTRIBUTES: "getChannelAttributes",
            GET_CUSTOM_CHANNEL_NUMBERING: "getCustomChannelNumbering",
            SET_CUSTOM_CHANNEL_NUMBERING: "setCustomChannelNumbering",
            CLEAR_CUSTOM_CHANNEL_NUMBERING: "clearCustomChannelNumbering",
            LOCK: "lock",
            UNLOCK: "unlock",
            GET_PLAYBACK_HISTORY: "getPlaybackHistory",
            GET_AUTOCOMPLETIONS: "getAutocompletions",
            GET_SUBSCRIBER_INFO: "getSubscriberInfo",
            GET_VAS_ITEMS: "getVasItems",
            CREATE_CUSTOM_API: "createCustomApi",
            CALL_CUSTOM_API: "callCustomApi",
            DESTROY_CUSTOM_API: "destroyCustomApi",
            GET_PARENTAL_BLOCKING_STATUS: "getParentalBlockingStatus",
            PARENTAL_UNBLOCK: "parentalUnblock",
            RESET_PARENTAL_UNBLOCKING: "resetParentalUnblocking",
            GET_BANDWIDTH_INFO: "getBandwidthInfo",
            GET_ITEMS: "getItems",
            SET_USER_SCORE: "setUserScore",
            CANCEL_REQUEST: "cancelRequest",
            CREATE_PROGRAMS_UPDATED_OBSERVER: "createProgramsUpdatedObserver",
            DESTROY_PROGRAMS_UPDATED_OBSERVER: "destroyProgramsUpdatedObserver",
            SEND_MESSAGE: "sendMessage",
            RESET_ALL_PARENTAL_UNBLOCKINGS: "resetAllParentalUnblockings",
            SEND_MESSAGE_RECEIPT: "sendMessageReceipt"
        };
        var ExternalIdType = {
            EXTERNAL_ID_TYPE_SERVICE_PROVIDER: 0,
            EXTERNAL_ID_TYPE_VOD_SYSTEM: 1,
            EXTERNAL_ID_TYPE_CMS: 2
        };
        var ZosaBandwidthBookingType = {
            BANDWIDTH_BOOKING_TYPE_META_DATA: 0,
            BANDWIDTH_BOOKING_TYPE_VOD: 1,
            BANDWIDTH_BOOKING_TYPE_LIVE_TV: 2,
            BANDWIDTH_BOOKING_TYPE_PVR: 3,
            BANDWIDTH_BOOKING_TYPE_DOWNLOAD: 4,
            BANDWIDTH_BOOKING_TYPE_CATCHUP_TV_IR: 5
        };
        var SelectedStreamReason = {
            REASON_UNKNOWN: 0,
            REASON_INSUFFICIENT_BANDWIDTH: 1,
            REASON_NOT_SUBSCRIBED: 2,
            REASON_OUTPUT_UHD_NOT_SUPPORTED: 3,
            REASON_OUTPUT_HDCP_VERSION_NOT_APPROPRIATE: 4,
            REASON_OUTPUT_VIDEO_DOWNSCALE: 5,
            REASON_OUTPUT_QUALITY_DOWNGRADE: 6
        };
        var PlaybackSessionStoppedEvent = {
            REASON_CONTENT_RESTRICTION: 1,
            REASON_INSUFFICIENT_BANDWIDTH: 2,
            REASON_TUNER_CONFLICT: 3
        };
        var Source = {
            SOURCE_DVB: 0,
            SOURCE_IP: 1
        };
        var DvbConflictType = {
            DVB_CONFLICT_TYPE_UNKNOWN: 0,
            DVB_CONFLICT_TYPE_TP: 1,
            DVB_CONFLICT_TYPE_CI: 2,
            DVB_CONFLICT_TYPE_TUNER: 3,
            DVB_CONFLICT_TYPE_IO: 4
        };
        return {
            ProtocolInfo : ProtocolInfo,
            RequestFields : RequestFields,
            ItemTypes : ItemTypes,
            ItemFields : ItemFields,
            RecordingSpaceType : RecordingSpaceType,
            DeviceType : DeviceType,
            ProfileType : ProfileType,
            PasswordType : PasswordType,
            SearchFilterType : SearchFilterType,
            ZosaSortDirection : ZosaSortDirection,
            ZosaAudioChannel : ZosaAudioChannel,
            ZosaAudioSupplementary : ZosaAudioSupplementary,
            ZosaChannelType : ZosaChannelType,
            TransmissionType : TransmissionType,
            ZosaAudioCodecType : ZosaAudioCodecType,
            ZosaVideoAspectRatio : ZosaVideoAspectRatio,
            ZosaSortAttribute : ZosaSortAttribute,
            VodType : VodType,
            VasType : VasType,
            ParticipantType : ParticipantType,
            SearchQueryFields : SearchQueryFields,
            EventFields : EventFields,
            EventTypes : EventTypes,
            PlaybackSessionPropertyNames : PlaybackSessionPropertyNames,
            CgmsaType : CgmsaType,
            MacrovisionType : MacrovisionType,
            ZosaDigitalContentProtectionType : ZosaDigitalContentProtectionType,
            HdcpVersionType : HdcpVersionType,
            Actions : Actions,
            ExternalIdType : ExternalIdType,
            ZosaBandwidthBookingType : ZosaBandwidthBookingType,
            SelectedStreamReason : SelectedStreamReason,
            PlaybackSessionStoppedEvent : PlaybackSessionStoppedEvent,
            Source : Source,
            DvbConflictType : DvbConflictType
        };
    })();
    var that = this;
    var playbackSessions = { };
    var requests = { };
    var customApis = { };
    var requestId = 1;
    var webSocket = null;
    var zosaUrl = null;
    var zosaUsername = null;
    var zosaPassword = null;
    var protocolVersion = _protocol.ProtocolInfo.VERSION;
    var programsUpdatedObservers = { };
    var SESSION_STATE_UNDEFINED = "UNDEFINED";
    var SESSION_STATE_INITIALIZED = "INITIALIZED";
    var SESSION_STATE_CONNECTING = "CONNECTING";
    var SESSION_STATE_CONNECTED = "CONNECTED";
    var SESSION_STATE_LOGGING_IN = "LOGGING_IN";
    var SESSION_STATE_LOGGED_IN = "LOGGED_IN";
    var SESSION_STATE_LOGGING_OUT = "LOGGING_OUT";
    var SESSION_STATE_LOGGED_OUT = "LOGGED_OUT";
    var SESSION_STATE_DISCONNECTING = "DISCONNECTING";
    var SESSION_STATE_DISCONNECTED = "DISCONNECTED";
    var sessionState = SESSION_STATE_UNDEFINED;
    var zosaConnectRequest = null;
    var zosaLoginRequestId = null;
    var onSessionError = function () { log.error("session error"); };
    var onReminder = function (event) { log.trace("reminder event"); };
    var onRecordingChanged = function (event) { log.trace("recordingChanged event"); };
    var onRecordingBandwidthConflict = function (event) { log.trace("recordingBandwidthConflict event"); };
    var onMessage = function (event) { log.trace("Message event"); };
    var onDataUpdated = function (event) { log.trace("dataUpdated event"); };
    var onServiceProviderSessionError = function (event) { log.trace("serviceProvider session error"); };
    var onParentalBlockingChanged = function (event) { log.trace("ParentalBlockingChanged event"); };
    var log = { error : function (e) { },
                warning : function (e) { },
                info : function (e) { },
                trace : function (e) { },
                exception : function (e) { } };
    this.API_VERSION_NAME = "0.166";
    this.API_VERSION_MAJOR = 0;
    this.API_VERSION_MINOR = 166;
    this.setLogger = function (logger) {
      if (logger.error != null) { log.error = logger.error; }
      if (logger.warning != null) { log.warning = logger.warning; }
      if (logger.info != null) { log.info = logger.info; }
      if (logger.trace != null) { log.trace = logger.trace; }
      if (logger.exception != null) { log.exception = logger.exception; }
      return that;
    };
    this.ZOSA_TYPE_SERVICE_PROVIDER_ITEM = _protocol.ItemTypes.SERVICE_PROVIDER_ITEM;
    this.ZOSA_TYPE_CHANNEL_ITEM = _protocol.ItemTypes.CHANNEL_ITEM;
    this.ZOSA_TYPE_PROGRAM_ITEM = _protocol.ItemTypes.PROGRAM_ITEM;
    this.ZOSA_TYPE_VOD_ITEM = _protocol.ItemTypes.VOD_ITEM;
    this.ZOSA_TYPE_STREAM_ITEM = _protocol.ItemTypes.STREAM_ITEM;
    this.ZOSA_TYPE_CHANNEL_STREAM = _protocol.ItemTypes.CHANNEL_STREAM_ITEM;
    this.ZOSA_TYPE_CATEGORY_ITEM = _protocol.ItemTypes.CATEGORY_ITEM;
    this.ZOSA_TYPE_PROFILE_ITEM = _protocol.ItemTypes.PROFILE_ITEM;
    this.ZOSA_TYPE_REMINDER_ITEM = _protocol.ItemTypes.REMINDER_ITEM;
    this.ZOSA_TYPE_MESSAGE_ITEM = _protocol.ItemTypes.MESSAGE_ITEM;
    this.ZOSA_TYPE_FAVORITE_LIST_ITEM = _protocol.ItemTypes.FAVORITE_LIST_ITEM;
    this.ZOSA_TYPE_OFFER_ITEM = _protocol.ItemTypes.OFFER_ITEM;
    this.ZOSA_TYPE_TICKET_ITEM = _protocol.ItemTypes.TICKET_ITEM;
    this.ZOSA_TYPE_RECORDING_ITEM = _protocol.ItemTypes.RECORDING_ITEM;
    this.ZOSA_TYPE_SUB_RECORDING_ITEM = _protocol.ItemTypes.SUB_RECORDING_ITEM;
    this.ZOSA_TYPE_PARENT_RECORDING_ITEM = _protocol.ItemTypes.PARENT_RECORDING_ITEM;
    this.ZOSA_TYPE_DEVICE_ITEM = _protocol.ItemTypes.DEVICE_ITEM;
    this.ZOSA_TYPE_MEDIA_PERSON_ITEM = _protocol.ItemTypes.MEDIA_PERSON_ITEM;
    this.ZOSA_TYPE_GENRE_ITEM = _protocol.ItemTypes.GENRE_ITEM;
    this.ZOSA_TYPE_BANDWIDTH_BOOKING_ITEM = _protocol.ItemTypes.BANDWIDTH_BOOKING_ITEM;
    this.ZOSA_TYPE_VAS_ITEM = "VasItem";
    this.OK = 0;
    this.INVALID_PARAMETER = 1;
    this.FEATURE_NOT_SUPPORTED = 2;
    this.INVALID_OPERATION = 4;
    this.RESTRICTED_ACCESS = 6;
    this.COMMUNICATION_ERROR = 10;
    this.INSUFFICIENT_RESOURCES = 11;
    this.UNKNOWN_ERROR = 12;
    this.TIMEOUT = 14;
    this.NOT_FOUND = 15;
    this.OPERATION_PENDING = 17;
    this.CONTENT_RESTRICTION = 20;
    this.PARENTAL_CONTROL_BLOCKED = 21;
    this.NOT_SUBSCRIBED = 22;
    this.INSUFFICIENT_BANDWIDTH = 23;
    this.NOT_PROVISIONED = 24;
    this.INVALID_CREDENTIALS = 25;
    this.NOT_LOGGED_IN = 26;
    this.INSUFFICIENT_STORAGE = 27;
    this.ACOUNT_IS_LOCKED = 28;
    this.DEVICE_NOT_AVAILABLE = 30;
    this.SESSION_EXPIRED = 31;
    this.INSUFFICIENT_WAN_BANDWIDTH = 32;
    this.CANCELED = 33;
    this.ALREADY_EXISTS = 35;
    this.IMAGE_TYPE_OTHER = 0;
    this.IMAGE_TYPE_BACKGROUND = 1;
    this.IMAGE_TYPE_POSTER = 2;
    this.IMAGE_TYPE_STILL = 3;
    this.IMAGE_TYPE_ICON = 4;
    this.CHANNEL_TYPE_TV = _protocol.ZosaChannelType.CHANNEL_TYPE_TV;
    this.CHANNEL_TYPE_RADIO = _protocol.ZosaChannelType.CHANNEL_TYPE_RADIO;
    this.CHANNEL_TYPE_APPLICATION = _protocol.ZosaChannelType.CHANNEL_TYPE_APPLICATION;
    this.TRANSMISSION_TYPE_UNKNOWN = _protocol.TransmissionType.TRANSMISSION_TYPE_UNKNOWN;
    this.TRANSMISSION_TYPE_DVB_C = _protocol.TransmissionType.TRANSMISSION_TYPE_DVB_C;
    this.TRANSMISSION_TYPE_DVB_S = _protocol.TransmissionType.TRANSMISSION_TYPE_DVB_S;
    this.TRANSMISSION_TYPE_DVB_T = _protocol.TransmissionType.TRANSMISSION_TYPE_DVB_T;
    this.TRANSMISSION_TYPE_DVB_C2 = _protocol.TransmissionType.TRANSMISSION_TYPE_DVB_C2;
    this.TRANSMISSION_TYPE_DVB_S2 = _protocol.TransmissionType.TRANSMISSION_TYPE_DVB_S2;
    this.TRANSMISSION_TYPE_DVB_T2 = _protocol.TransmissionType.TRANSMISSION_TYPE_DVB_T2;
    this.TRANSMISSION_TYPE_ISDB_C = _protocol.TransmissionType.TRANSMISSION_TYPE_ISDB_C;
    this.TRANSMISSION_TYPE_ISDB_S = _protocol.TransmissionType.TRANSMISSION_TYPE_ISDB_S;
    this.TRANSMISSION_TYPE_ISDB_T = _protocol.TransmissionType.TRANSMISSION_TYPE_ISDB_T;
    this.TRANSMISSION_TYPE_ATSC_T = _protocol.TransmissionType.TRANSMISSION_TYPE_ATSC_T;
    this.TRANSMISSION_TYPE_ATSC_C = _protocol.TransmissionType.TRANSMISSION_TYPE_ATSC_C;
    this.TRANSMISSION_TYPE_IPTV = _protocol.TransmissionType.TRANSMISSION_TYPE_IPTV;
    this.DVB_CONFLICT_TYPE_UNKNOWN = _protocol.DvbConflictType.DVB_CONFLICT_TYPE_UNKNOWN;
    this.DVB_CONFLICT_TYPE_TP = _protocol.DvbConflictType.DVB_CONFLICT_TYPE_TP;
    this.DVB_CONFLICT_TYPE_CI = _protocol.DvbConflictType.DVB_CONFLICT_TYPE_CI;
    this.DVB_CONFLICT_TYPE_TUNER = _protocol.DvbConflictType.DVB_CONFLICT_TYPE_TUNER;
    this.DVB_CONFLICT_TYPE_IO = _protocol.DvbConflictType.DVB_CONFLICT_TYPE_IO;
    this.RECORDING_STATE_NONE = 0;
    this.RECORDING_STATE_SCHEDULED = 1 << 0;
    this.RECORDING_STATE_ONGOING = 1 << 1;
    this.RECORDING_STATE_COMPLETE = 1 << 2;
    this.RECORDING_STATE_PARTIALLY_COMPLETE = 1 << 3;
    this.RECORDING_STATE_FAILED = 1 << 4;
    this.RECORDING_STATE_CONFLICT = 1 << 5;
    this.RECORDING_STATE_OFFLINE = 1 << 6;
    this.RECORDING_FAIL_REASON_UNKNOWN = 0;
    this.RECORDING_FAIL_REASON_TOO_MANY_RECORDERS = 1;
    this.RECORDING_FAIL_REASON_OUT_OF_DISK_SPACE = 2;
    this.RECORDING_FAIL_REASON_SOURCE_UNAVAILABLE = 3;
    this.RECORDING_FAIL_REASON_POWER_INTERRUPTION = 4;
    this.RECORDING_FAIL_REASON_CONTENT_RESTRICTION = 5;
    this.RECORDING_FAIL_REASON_ACCESS_DENIED = 6;
    this.RECORDING_TYPE_NONE = 0;
    this.RECORDING_TYPE_NPVR = 1;
    this.RECORDING_TYPE_CPVR = 2;
    this.RECORDING_TYPE_NPVR_CPVR = 3;
    this.RECORDING_CONFLICT_REASON_RECORDING = 1;
    this.RECORDING_CONFLICT_REASON_PLAYER = 2;
    this.RECORDING_CONFLICT_REASON_BANDWIDTH = 3;
    this.PARENT_RECORDING_TYPE_PERIODIC = 0;
    this.PARENT_RECORDING_TYPE_SERIES = 1;
    this.PARENT_RECORDING_TYPE_KEYWORD = 2;
    this.RECORDING_DELETE_MODE_AUTO = 0;
    this.RECORDING_DELETE_MODE_MANUAL = 1;
    this.RECORDING_DELETE_MODE_RETAIN_EPISODES = 2;
    this.EPISODE_SELECTION_ALL = 0;
    this.EPISODE_SELECTION_CURRENT_OR_NEWER_SEASON = 1;
    this.EPISODE_SELECTION_TIME = 2;
    this.RECUR_TYPE_WEEKLY = 0;
    this.RECUR_TYPE_MONTHLY = 1;
    this.RECUR_END_STYLE_NONE = 0;
    this.RECUR_END_STYLE_REPETITIONS = 1;
    this.RECUR_END_STYLE_TIME = 2;
    this.WEEKLY_RECURRENCE_MONDAY = 1 << 1;
    this.WEEKLY_RECURRENCE_TUESDAY = 1 << 2;
    this.WEEKLY_RECURRENCE_WEDNESDAY = 1 << 3;
    this.WEEKLY_RECURRENCE_THURSDAY = 1 << 4;
    this.WEEKLY_RECURRENCE_FRIDAY = 1 << 5;
    this.WEEKLY_RECURRENCE_SATURDAY = 1 << 6;
    this.WEEKLY_RECURRENCE_SUNDAY = 1 << 7;
    this.REMOTE_RECORDING_SCHEDULING_OK = 0;
    this.REMOTE_RECORDING_SCHEDULING_UNKNOWN_DISK_SPACE = 1;
    this.REMOTE_RECORDING_SCHEDULING_DEVICE_NOT_AVAILABLE = 2;
    this.SOURCE_DVB = _protocol.Source.SOURCE_DVB;
    this.SOURCE_IP = _protocol.Source.SOURCE_IP;
    this.DEVICE_TYPE_UNKNOWN = _protocol.DeviceType.DEVICE_TYPE_UNKNOWN;
    this.DEVICE_TYPE_STB = _protocol.DeviceType.DEVICE_TYPE_STB;
    this.DEVICE_TYPE_OTT = _protocol.DeviceType.DEVICE_TYPE_OTT;
    this.DEVICE_TYPE_PC = _protocol.DeviceType.DEVICE_TYPE_PC;
    this.PROFILE_TYPE_ADMIN = _protocol.ProfileType.PROFILE_TYPE_ADMIN;
    this.PROFILE_TYPE_USER = _protocol.ProfileType.PROFILE_TYPE_USER;
    this.RECORDING_SPACE_TYPE_UNDEFINED = _protocol.RecordingSpaceType.RECORDING_SPACE_TYPE_UNDEFINED;
    this.RECORDING_SPACE_TYPE_CLIENT = _protocol.RecordingSpaceType.RECORDING_SPACE_TYPE_CLIENT;
    this.RECORDING_SPACE_TYPE_NETWORK = _protocol.RecordingSpaceType.RECORDING_SPACE_TYPE_NETWORK;
    this.PASSWORD_TYPE_SUBSCRIBER = _protocol.PasswordType.PASSWORD_TYPE_SUBSCRIBER;
    this.PASSWORD_TYPE_ADMIN = _protocol.PasswordType.PASSWORD_TYPE_ADMIN;
    this.PASSWORD_TYPE_PARENTAL = _protocol.PasswordType.PASSWORD_TYPE_PARENTAL;
    this.PASSWORD_TYPE_ADULT = _protocol.PasswordType.PASSWORD_TYPE_ADULT;
    this.PASSWORD_TYPE_PURCHASE = _protocol.PasswordType.PASSWORD_TYPE_PURCHASE;
    this.PASSWORD_TYPE_PROFILE = _protocol.PasswordType.PASSWORD_TYPE_PROFILE;
    this.EXTERNAL_ID_TYPE_SERVICE_PROVIDER = _protocol.ExternalIdType.EXTERNAL_ID_TYPE_SERVICE_PROVIDER;
    this.EXTERNAL_ID_TYPE_VOD_SYSTEM = _protocol.ExternalIdType.EXTERNAL_ID_TYPE_VOD_SYSTEM;
    this.EXTERNAL_ID_TYPE_CMS = _protocol.ExternalIdType.EXTERNAL_ID_TYPE_CMS;
     this.SEARCH_FIELD_TITLE = _protocol.SearchQueryFields.TITLE;
     this.SEARCH_FIELD_ACTOR = _protocol.SearchQueryFields.ACTOR;
     this.SEARCH_FIELD_DIRECTOR = _protocol.SearchQueryFields.DIRECTOR;
     this.SEARCH_FIELD_KEYWORD = _protocol.SearchQueryFields.KEYWORD;
    this.SEARCH_FIELD_GENRE = _protocol.SearchQueryFields.GENRE;
    this.SEARCH_FILTER_INCLUDE = _protocol.SearchFilterType.SEARCH_FILTER_INCLUDE;
    this.SEARCH_FILTER_ONLY = _protocol.SearchFilterType.SEARCH_FILTER_ONLY;
    this.SEARCH_FILTER_EXCLUDE = _protocol.SearchFilterType.SEARCH_FILTER_EXCLUDE;
    var EVENT_TYPE_REMINDER = _protocol.EventTypes.REMINDER;
    var EVENT_TYPE_RECORDING_CHANGED = _protocol.EventTypes.RECORDING_CHANGED;
    var EVENT_TYPE_RECORDING_BANDWIDTH_CONFLICT = _protocol.EventTypes.RECORDING_BANDWIDTH_CONFLICT;
    var EVENT_TYPE_MESSAGE = _protocol.EventTypes.MESSAGE;
    var EVENT_TYPE_PLAYBACK_SESSION_STOPPED = _protocol.EventTypes.PLAYBACK_SESSION_STOPPED;
    var EVENT_TYPE_CUR_UPDATED = _protocol.EventTypes.CUR_UPDATED;
    var EVENT_TYPE_PLAYBACK_SESSION_CUSTOM_PROPERTIES_UPDATED = _protocol.EventTypes.PLAYBACK_SESSION_CUSTOM_PROPERTIES_UPDATED;
    var EVENT_TYPE_DATA_UPDATED = _protocol.EventTypes.DATA_UPDATED;
    var EVENT_TYPE_SERVICE_PROVIDER_SESSION_ERROR = _protocol.EventTypes.SERVICE_PROVIDER_SESSION_ERROR;
    var EVENT_TYPE_CUSTOM_API = _protocol.EventTypes.CUSTOM_API;
    var EVENT_TYPE_PARENTAL_BLOCKING_CHANGED = _protocol.EventTypes.PARENTAL_BLOCKING_CHANGED;
    var EVENT_TYPE_PROGRAMS_UPDATED = _protocol.EventTypes.PROGRAMS_UPDATED
    this.PLAYBACK_SESSION_STOPPED_REASON_CONTENT_RESTRICTION = _protocol.PlaybackSessionStoppedEvent.REASON_CONTENT_RESTRICTION;
 
   
    this.PLAYBACK_SESSION_STOPPED_REASON_INSUFFICIENT_BANDWIDTH = _protocol.PlaybackSessionStoppedEvent.REASON_INSUFFICIENT_BANDWIDTH;
 
   
    this.PLAYBACK_SESSION_STOPPED_REASON_TUNER_CONFLICT = _protocol.PlaybackSessionStoppedEvent.REASON_TUNER_CONFLICT;
    this.VOD_TYPE_NORMAL = _protocol.VodType.VOD_TYPE_NORMAL;
    this.VOD_TYPE_SERIES = _protocol.VodType.VOD_TYPE_SERIES;
    this.VOD_TYPE_SEASON = _protocol.VodType.VOD_TYPE_SEASON;
    this.PARTICIPANT_TYPE_OTHER = _protocol.ParticipantType.PARTICIPANT_TYPE_OTHER;
    this.PARTICIPANT_TYPE_ACTOR = _protocol.ParticipantType.PARTICIPANT_TYPE_ACTOR;
    this.PARTICIPANT_TYPE_DIRECTOR = _protocol.ParticipantType.PARTICIPANT_TYPE_DIRECTOR;
    this.PARTICIPANT_TYPE_PRODUCER = _protocol.ParticipantType.PARTICIPANT_TYPE_PRODUCER;
    this.PARTICIPANT_TYPE_SINGER = _protocol.ParticipantType.PARTICIPANT_TYPE_SINGER;
    this.PARTICIPANT_TYPE_WRITER = _protocol.ParticipantType.PARTICIPANT_TYPE_WRITER;
    this.GENRE_TYPE_OTHER = 0;
    this.GENRE_TYPE_MOVIE = 1;
    this.GENRE_TYPE_MUSIC = 2;
    this.GENRE_TYPE_PROGRAM = 3;
    this.GENRE_TYPE_VAS = 4;
    this.VIDEO_DEFINITION_UNKNOWN = 0;
    this.VIDEO_DEFINITION_SD = 1;
    this.VIDEO_DEFINITION_HD = 2;
    this.VIDEO_DEFINITION_UHD = 3;
    this.VIDEO_3D_FORMAT_NONE = 0;
    this.VIDEO_3D_FORMAT_SIDE_BY_SIDE = 1;
    this.VIDEO_3D_FORMAT_TOP_AND_BOTTOM = 2;
    this.CGMSA_TYPE_COPY_FREELY = _protocol.CgmsaType.COPY_FREELY;
    this.CGMSA_TYPE_COPY_NO_MORE = _protocol.CgmsaType.COPY_NO_MORE;
     this.CGMSA_TYPE_COPY_ONCE = _protocol.CgmsaType.COPY_ONCE;
    this.CGMSA_TYPE_COPY_NEVER = _protocol.CgmsaType.COPY_NEVER;
    this.MACROVISION_TYPE_OFF = _protocol.MacrovisionType.OFF;
    this.MACROVISION_TYPE_AGC = _protocol.MacrovisionType.AGC;
    this.MACROVISION_TYPE_AGC_2_STRIPE = _protocol.MacrovisionType.AGC_2_STRIPE;
    this.MACROVISION_TYPE_AGC_4_STRIPE = _protocol.MacrovisionType.AGC_4_STRIPE;
    this.DIGITAL_CONTENT_PROTECTION_NONE = _protocol.ZosaDigitalContentProtectionType.NONE;
    this.DIGITAL_CONTENT_PROTECTION_OPTIONAL = _protocol.ZosaDigitalContentProtectionType.OPTIONAL;
    this.DIGITAL_CONTENT_PROTECTION_MANDATORY_HD = _protocol.ZosaDigitalContentProtectionType.MANDATORY_HD;
    this.DIGITAL_CONTENT_PROTECTION_MANDATORY = _protocol.ZosaDigitalContentProtectionType.MANDATORY;
     this.HDCP_NOT_APPLICABLE = _protocol.HdcpVersionType.HDCP_NOT_APPLICABLE
     this.HDCP_NOT_ENGAGED = _protocol.HdcpVersionType.HDCP_NOT_ENGAGED
     this.HDCP_1_0 = _protocol.HdcpVersionType.HDCP_1_0
     this.HDCP_1_1 = _protocol.HdcpVersionType.HDCP_1_1
     this.HDCP_1_2 = _protocol.HdcpVersionType.HDCP_1_2
     this.HDCP_1_3 = _protocol.HdcpVersionType.HDCP_1_3
     this.HDCP_1_4 = _protocol.HdcpVersionType.HDCP_1_4
     this.HDCP_2_0 = _protocol.HdcpVersionType.HDCP_2_0
     this.HDCP_2_1 = _protocol.HdcpVersionType.HDCP_2_1
     this.HDCP_2_2 = _protocol.HdcpVersionType.HDCP_2_2
    this.VAS_TYPE_OTHER = _protocol.VasType.VAS_TYPE_OTHER;
    this.VAS_TYPE_APP = _protocol.VasType.VAS_TYPE_APP;
    this.SORT_ATTRIBUTE_START_TIME = _protocol.ZosaSortAttribute.SORT_ATTRIBUTE_START_TIME;
    this.SORT_ATTRIBUTE_NAME = _protocol.ZosaSortAttribute.SORT_ATTRIBUTE_NAME;
    this.SORT_ATTRIBUTE_AVAILABILITY_START_TIME = _protocol.ZosaSortAttribute.SORT_ATTRIBUTE_AVAILABILITY_START_TIME;
    this.SORT_ATTRIBUTE_LAST_PLAYBACK_TIME = _protocol.ZosaSortAttribute.SORT_ATTRIBUTE_LAST_PLAYBACK_TIME;
    this.SORT_ATTRIBUTE_DURATION = _protocol.ZosaSortAttribute.SORT_ATTRIBUTE_DURATION;
    this.SORT_ATTRIBUTE_COLLECT_TIME = _protocol.ZosaSortAttribute.SORT_ATTRIBUTE_COLLECT_TIME;
    this.SORT_DIRECTION_ASCENDING = _protocol.ZosaSortDirection.SORT_DIRECTION_ASCENDING;
    this.SORT_DIRECTION_DESCENDING = _protocol.ZosaSortDirection.SORT_DIRECTION_DESCENDING;
    this.CODEC_NONE = _protocol.ZosaAudioCodecType.CODEC_NONE;
    this.CODEC_PCM = _protocol.ZosaAudioCodecType.CODEC_PCM;
    this.CODEC_MP2 = _protocol.ZosaAudioCodecType.CODEC_MP2;
    this.CODEC_MP3 = _protocol.ZosaAudioCodecType.CODEC_MP3;
    this.CODEC_DTS = _protocol.ZosaAudioCodecType.CODEC_DTS;
    this.CODEC_AC3 = _protocol.ZosaAudioCodecType.CODEC_AC3;
    this.CODEC_EAC3 = _protocol.ZosaAudioCodecType.CODEC_EAC3;
    this.CODEC_AAC = _protocol.ZosaAudioCodecType.CODEC_AAC;
    this.CODEC_HEAAC = _protocol.ZosaAudioCodecType.CODEC_HEAAC;
    this.CODEC_HEAAC_ADTS = _protocol.ZosaAudioCodecType.CODEC_HEAAC_ADTS;
    this.CODEC_HEAAC_V2 = _protocol.ZosaAudioCodecType.CODEC_HEAAC_V2;
    this.CODEC_HEAAC_V2_ADTS = _protocol.ZosaAudioCodecType.CODEC_HEAAC_V2_ADTS;
    this.SUPPLEMENTARY_NORMAL = _protocol.ZosaAudioSupplementary.SUPPLEMENTARY_NORMAL;
    this.SUPPLEMENTARY_AUDIO_DESCRIPTION = _protocol.ZosaAudioSupplementary.SUPPLEMENTARY_AUDIO_DESCRIPTION;
    this.SUPPLEMENTARY_SPOKEN_SUBTITLING = _protocol.ZosaAudioSupplementary.SUPPLEMENTARY_SPOKEN_SUBTITLING;
    this.SUPPLEMENTARY_CLEAN_AUDIO = _protocol.ZosaAudioSupplementary.SUPPLEMENTARY_CLEAN_AUDIO;
    this.SUPPLEMENTARY_AUDIO_OTHER = _protocol.ZosaAudioSupplementary.SUPPLEMENTARY_AUDIO_OTHER;
    this.SUPPLEMENTARY_AUDIO_WITH_PARAMETRIC_DATA = _protocol.ZosaAudioSupplementary.SUPPLEMENTARY_AUDIO_WITH_PARAMETRIC_DATA;
    this.AUDIO_CHANNEL_STEREO = _protocol.ZosaAudioChannel.AUDIO_CHANNEL_STEREO;
    this.AUDIO_CHANNEL_MULTICHANNEL = _protocol.ZosaAudioChannel.AUDIO_CHANNEL_MULTICHANNEL;
    this.AUDIO_CHANNEL_MONO = _protocol.ZosaAudioChannel.AUDIO_CHANNEL_MONO;
    this.AUDIO_CHANNEL_MONO_LEFT = _protocol.ZosaAudioChannel.AUDIO_CHANNEL_MONO_LEFT;
    this.AUDIO_CHANNEL_MONO_RIGHT = _protocol.ZosaAudioChannel.AUDIO_CHANNEL_MONO_RIGHT;
    this.AUDIO_CHANNEL_DUAL_MONO = _protocol.ZosaAudioChannel.AUDIO_CHANNEL_DUAL_MONO;
    this.AUDIO_CHANNEL_JOINT_STEREO = _protocol.ZosaAudioChannel.AUDIO_CHANNEL_JOINT_STEREO;
 this.BANDWIDTH_BOOKING_TYPE_META_DATA = _protocol.ZosaBandwidthBookingType.BANDWIDTH_BOOKING_TYPE_META_DATA;
 this.BANDWIDTH_BOOKING_TYPE_VOD = _protocol.ZosaBandwidthBookingType.BANDWIDTH_BOOKING_TYPE_VOD;
 this.BANDWIDTH_BOOKING_TYPE_LIVE_TV = _protocol.ZosaBandwidthBookingType.BANDWIDTH_BOOKING_TYPE_LIVE_TV;
 this.BANDWIDTH_BOOKING_TYPE_PVR = _protocol.ZosaBandwidthBookingType.BANDWIDTH_BOOKING_TYPE_PVR;
 this.BANDWIDTH_BOOKING_TYPE_DOWNLOAD = _protocol.ZosaBandwidthBookingType.BANDWIDTH_BOOKING_TYPE_DOWNLOAD;
 this.BANDWIDTH_BOOKING_TYPE_CATCHUP_TV_IR = _protocol.ZosaBandwidthBookingType.BANDWIDTH_BOOKING_TYPE_CATCHUP_TV_IR;
    this.ASPECT_RATIO_4_3 = _protocol.ZosaVideoAspectRatio.ASPECT_RATIO_4_3;
    this.ASPECT_RATIO_16_9 = _protocol.ZosaVideoAspectRatio.ASPECT_RATIO_16_9;
    this.ASPECT_RATIO_GREATER_THAN_16_9 = _protocol.ZosaVideoAspectRatio.ASPECT_RATIO_GREATER_THAN_16_9;
    this.SELECTED_STREAM_REASON_UNKNOWN = _protocol.SelectedStreamReason.REASON_UNKNOWN;
    this.SELECTED_STREAM_REASON_INSUFFICIENT_BANDWIDTH = _protocol.SelectedStreamReason.REASON_INSUFFICIENT_BANDWIDTH;
    this.SELECTED_STREAM_REASON_NOT_SUBSCRIBED = _protocol.SelectedStreamReason.REASON_NOT_SUBSCRIBED;
    this.SELECTED_STREAM_REASON_OUTPUT_UHD_NOT_SUPPORTED = _protocol.SelectedStreamReason.REASON_OUTPUT_UHD_NOT_SUPPORTED;
    this.SELECTED_STREAM_REASON_OUTPUT_HDCP_VERSION_NOT_APPROPRIATE = _protocol.SelectedStreamReason.REASON_OUTPUT_HDCP_VERSION_NOT_APPROPRIATE;
    this.SELECTED_STREAM_REASON_OUTPUT_VIDEO_DOWNSCALE = _protocol.SelectedStreamReason.REASON_OUTPUT_VIDEO_DOWNSCALE;
    this.SELECTED_STREAM_REASON_OUTPUT_QUALITY_DOWNGRADE = _protocol.SelectedStreamReason.REASON_OUTPUT_QUALITY_DOWNGRADE;
    this.DVB_EIT_PRESENT_FOLLOWING_FLAG = 1 << 0;
    this.DVB_EIT_SCHEDULE_FLAG = 1 << 1;
    this.setOnSessionError = function(func)
    {
      onSessionError = func;
      return that;
    };
    this.setOnReminder = function(func)
    {
      onReminder = func;
      return that;
    };
    this.setOnRecordingChanged = function(func)
    {
      onRecordingChanged = func;
      return that;
    };
    this.setOnRecordingBandwidthConflict = function(func)
    {
      onRecordingBandwidthConflict = func;
      return that;
    };
    this.setOnMessage = function(func)
    {
      onMessage = func;
      return that;
    };
    this.setOnDataUpdated = function(func)
    {
      onDataUpdated = func;
      return that;
    };
    this.setOnServiceProviderSessionError = function(func)
    {
      onServiceProviderSessionError = func;
      return that;
    }
    this.setOnParentalBlockingChanged = function(func)
    {
      onParentalBlockingChanged = func;
      return that;
    };
    this._cancelRequest = function(cancelRequestId)
    {
      var message = new ZosaRequestMessage("cancel", 0);
      message.cancelRequestId = cancelRequestId;
      log.trace("Sending: " + message);
      webSocket.send(message);
      delete requests[cancelRequestId];
    };
    this.login = function(params)
    {
      log.trace("login");
      if (!params) { params = { }; }
      zosaUrl = params.url ? params.url : "ws://zosa:8001";
      zosaUsername = params.username;
      zosaPassword = params.password;
      var request = makeConnectAndLoginRequest();
      connect()
        .success(function (event) {
          zosaLogin()
            .success(function (event) {
              request._fireSuccess(event);
            })
            .failure(function (event) {
              request._fireFailure(event);
            });
        })
        .failure(function (event) {
          request._fireFailure(event);
        });
      request._prepareResponse = function (r) {
        return {};
      }
      return request;
    };
    this.logout = function(params)
    {
      log.trace("logout");
      if (!params) { params = { }; }
      var zosaLogoutRequest = new ZosaRequest(that, log);
      term(params);
      setSessionState(SESSION_STATE_DISCONNECTED);
      setTimeout(function () {
        var event = new ZosaRequestResponseEvent();
        zosaLogoutRequest._fireSuccess(event);
      }, 0);
      return zosaLogoutRequest;
    };
    this.getChannels = function(params)
    {
      log.trace("getChannels");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_CHANNELS, requestId);
      if (params.channels != null) { message.channelIds = toItemIds(params.channels); }
      if (params.category != null) { message.categoryId = toItemId(params.category); }
      if (params.favoriteList != null) { message.favoriteListId = toItemId(params.favoriteList); }
      if (params.genre != null) { message.genreId = toItemId(params.genre); }
      if (params.externalChannelIds != null) { message.externalChannelIds = params.externalChannelIds; }
      if (params.externalChannelIdType != null) { message.externalChannelIdType = params.externalChannelIdType; }
      if (params.dvbChannelStreamIds != null) { message.dvbChannelStreamIds = params.dvbChannelStreamIds; }
      if (params.onlyTransmissionTypes != null) {message.onlyTransmissionTypes = params.onlyTransmissionTypes; }
      message.serviceProviderChannelIds = params.serviceProviderChannelIds;
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      message.onlySubscribed = params.onlySubscribed;
      message.includeHidden = params.includeHidden;
      return makeRequest(message);
    };
    this.getPrograms = function(params)
    {
      log.trace("getPrograms");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_PROGRAMS, requestId);
      if (params.programs != null) { message.programIds = toItemIds(params.programs); }
      if (params.startTime != null) { message.startTime = toItemTime(params.startTime); }
      if (params.endTime != null) { message.endTime = toItemTime(params.endTime); }
      if (params.genre != null) { message.genreId = toItemId(params.genre); }
      if (params.genres != null) { message.genreIds = toItemIds(params.genres); }
      if (params.externalProgramIdType != null) { message.externalProgramIdType = params.externalProgramIdType; }
      if (params.externalProgramIds != null) { message.externalProgramIds = params.externalProgramIds; }
      if (params.channels != null) { message.channelIds = toItemIds(params.channels); }
      if (params.dvbEventId) { message.dvbEventId = 1*params.dvbEventId; }
      message.serviceProviderProgramIds = params.serviceProviderProgramIds;
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.channelId = toItemId(params.channel);
      message.offset = params.offset;
      message.limit = params.limit;
      message.sortOrder = params.sortOrder;
      message.onlyCatchUpAvailable = params.onlyCatchUpAvailable;
      message.itemFields = params.itemFields ? params.itemFields : [];
      message.onlySubscribed = params.onlySubscribed;
      return makeRequest(message);
    };
    this.getOtherInstances = function(params)
    {
        log.trace("getOtherInstances");
        if (!params) { params = {}; }
        var message = new ZosaRequestMessage(_protocol.Actions.GET_OTHER_INSTANCES, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        message.contentId = toItemId(params.content);
        if (params.contentTypes != null) { message.contentTypes = params.contentTypes; }
        if (params.startTime != null) { message.startTime = params.startTime; }
        if (params.endTime != null) { message.endTime = params.endTime; }
        message.itemFields = params.itemFields ? params.itemFields : [];
        return makeRequest(message);
    }
    this.getVods = function(params)
    {
      log.trace("getVods");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_VODS, requestId);
      if (params.vods != null) { message.vodIds = toItemIds(params.vods); }
      if (params.category != null) { message.categoryId = toItemId(params.category); }
      if (params.favoriteList != null) { message.favoriteListId = toItemId(params.favoriteList); }
      if (params.parentVod != null) { message.parentVodId = toItemId(params.parentVod); }
      if (params.genre != null) { message.genreId = toItemId(params.genre); }
      if (params.genres != null) { message.genreIds = toItemIds(params.genres); }
      if (params.sortOrder != null) { message.sortOrder = params.sortOrder; }
      message.serviceProviderVodIds = params.serviceProviderVodIds;
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.externalVodIds = params.externalVodIds;
      message.externalVodIdType = params.externalVodIdType;
      message.onlySubscribed = params.onlySubscribed;
      message.onlyNotSubscribed = params.onlyNotSubscribed;
      message.onlyRoots = params.onlyRoots;
      message.customProps = params.customProps;
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    };
    this.setChannelAttributes = function(params)
    {
        log.trace("setChannelAttributes");
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.SET_CHANNEL_ATTRIBUTES, requestId);
        message.channelAttributes = params.attributes;
        return makeRequest(message);
    };
    this.getChannelAttributes = function(params)
    {
        log.trace("getChannelAttributes");
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.GET_CHANNEL_ATTRIBUTES, requestId);
        return makeRequest(message);
    };
    this.setCustomChannelNumbering = function(params)
    {
        log.trace("setCustomChannelNumbering");
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.SET_CUSTOM_CHANNEL_NUMBERING, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        if (params.numbering != null) { message.numbering = toItemIds(params.numbering); }
        if (params.device != null) { message.deviceId = toItemId(params.device); }
        return makeRequest(message);
    };
    this.getCustomChannelNumbering = function(params)
    {
        log.trace("getCustomChannelNumbering");
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.GET_CUSTOM_CHANNEL_NUMBERING, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        if (params.device != null) { message.deviceId = toItemId(params.device); }
        return makeRequest(message);
    };
    this.clearCustomChannelNumbering = function(params)
    {
        log.trace("clearCustomChannelNumbering");
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.CLEAR_CUSTOM_CHANNEL_NUMBERING, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        if (params.device != null) { message.deviceId = toItemId(params.device); }
        return makeRequest(message);
    };
    this.getCategories = function(params)
    {
      log.trace("getCategories");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_CATEGORIES, requestId);
      if (params.parentCategory != null) { message.parentCategoryId = toItemId(params.parentCategory); }
      if (params.contentType != null) { message.contentType = params.contentType; }
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.serviceProviderCategoryIds != null) { message.serviceProviderCategoryIds = params.serviceProviderCategoryIds; }
      if (params.categories != null) { message.categoryIds = toItemIds(params.categories); }
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    };
    this.getGenres = function(params)
    {
      log.trace("getGenres");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_GENRES, requestId);
      if (params.genreType != null) { message.genreType = params.genreType; }
      if (params.genres != null) { message.genreIds = toItemIds(params.genres); }
      if (params.serviceProviderGenreIds != null) {
        message.serviceProviderGenreIds = params.serviceProviderGenreIds;
      }
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    };
    this.getCurrentProfile = function(params)
    {
      log.trace("getCurrentProfile");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_CURRENT_PROFILE, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    };
    this.getProfiles = function(params)
    {
      log.trace("getProfiles");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_PROFILES, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.profiles != null) { message.profileIds = toItemIds(params.profiles); }
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    };
    this.switchProfile = function(params) {
      log.trace("switchProfile");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SWITCH_PROFILE, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.profileId = toItemId(params.profile);
      message.password = params.password;
      return makeRequest(message);
    }
    this.addProfile = function(params) {
      log.trace("addProfile");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.ADD_PROFILE, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.name = params.name;
      message.password = params.password;
      message.description = params.description;
      message.imageUrl = params.imageUrl;
      message.parentalLevel = params.parentalLevel;
      message.reminderMargin = params.reminderMargin;
      message.language = params.language;
      return makeRequest(message);
    }
    this.removeProfile = function(params) {
      log.trace("removeProfile");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.REMOVE_PROFILE, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.profileId = toItemId(params.profile);
      return makeRequest(message);
    }
    this.modifyProfile = function(params) {
      log.trace("modifyProfile");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.MODIFY_PROFILE, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.profileId = toItemId(params.profile);
      message.name = params.name;
      message.password = params.password;
      message.description = params.description;
      message.imageUrl = params.imageUrl;
      message.parentalLevel = params.parentalLevel;
      message.reminderMargin = params.reminderMargin;
      message.language = params.language;
      return makeRequest(message);
    }
    this.getRatingSystems = function(params)
    {
      log.trace("getRatingSystems");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_RATING_SYSTEMS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    };
    this.getSupportedLanguages = function(params)
    {
      log.trace("getSupportedLanguages");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_LANGUAGES, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    };
    this.getFavoriteLists = function(params) {
      log.trace("getFavoriteLists");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_FAVORITE_LISTS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.contentType = params.contentType;
      message.itemFields = params.itemFields ? params.itemFields : [];
      message.offset = params.offset;
      message.limit = params.limit;
      return makeRequest(message);
    }
    this.addFavorites = function(params) {
      log.trace("addFavorites");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.ADD_FAVORITES, requestId);
      message.favoriteListId = toItemId(params.favoriteList);
      message.contentIds = toItemIds(params.contents);
      return makeRequest(message);
    }
    this.removeFavorites = function(params) {
      log.trace("removeFavorites");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.REMOVE_FAVORITES, requestId);
      message.favoriteListId = toItemId(params.favoriteList);
      message.contentIds = toItemIds(params.contents);
      return makeRequest(message);
    }
    this.clearFavorites = function(params) {
      log.trace("clearFavorites");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.CLEAR_FAVORITES, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    }
    this.sortFavorites = function(params) {
      log.trace("sortFavorites");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SORT_FAVORITES, requestId);
      message.favoriteListId = toItemId(params.favoriteList);
      message.contentIds = toItemIds(params.contents);
      return makeRequest(message);
    }
    this.getReminders = function(params) {
      log.trace("getReminders");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_REMINDERS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.addReminder = function(params) {
      log.trace("addReminder");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.ADD_REMINDER, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.contentId = toItemId(params.content);
      if(params.time) message.time = params.time;
      return makeRequest(message);
    }
    this.removeReminders = function(params) {
      log.trace("removeReminders");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.REMOVE_REMINDERS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.contents = toItemIds(params.contents);
      return makeRequest(message);
    }
    this.clearReminders = function(params) {
      log.trace("clearReminders");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.CLEAR_REMINDERS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    }
    this.getServiceProviders = function(params)
    {
      log.trace("getServiceProviders");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_SERVICE_PROVIDERS, requestId);
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    };
    this.serviceProviderLogin = function(params)
    {
      log.trace("serviceProviderLogin");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SERVICE_PROVIDER_LOGIN, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.url = params.url;
      message.username = params.username;
      message.password = params.password;
      message.deviceModel = params.deviceModel;
      message.deviceId = params.deviceId;
      message.deviceIp = params.deviceIp;
      message.deviceMac = params.deviceMac;
      message.customProps = params.customProps;
      return makeRequest(message);
    };
    this.serviceProviderLogout = function(params)
    {
      log.trace("serviceProviderLogout");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SERVICE_PROVIDER_LOGOUT, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    };
    this.createPlaybackSession = function(params)
    {
      log.trace("createPlaybackSession");
      var message = new ZosaRequestMessage(_protocol.Actions.CREATE_PLAYBACK_SESSION, requestId);
      message.mediaId = toItemId(params.media);
      if (params.oldSession != null) {
        if (typeof params.oldSession === 'object' && "sessionId" in params.oldSession) {
          message.oldSessionId = params.oldSession.sessionId;
        }
        else {
           message.oldSessionId = params.oldSession;
        }
      }
      if (params.startFromBeginning != null) { message.startFromBeginning = params.startFromBeginning; }
      if (params.preferredStreamDefinition != null) { message.preferredStreamDefinition = params.preferredStreamDefinition; }
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        var session = new ZosaPlaybackSession(that, r.sessionId, r.mediaUrl,
          r.usageRestrictions, r.lastPlaybackPosition, r.alternativeStreamSelected,
          r.selectedStream, r.selectedStreamReason, r.customProps);
        playbackSessions[r.sessionId] = session;
        return session;
      }
      return request;
    };
    this._destroyPlaybackSession = function(sessionId)
    {
      log.trace("_destroyPlaybackSession");
      var message = new ZosaRequestMessage(_protocol.Actions.DESTROY_PLAYBACK_SESSION, requestId);
      message.sessionId = sessionId;
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        delete playbackSessions[sessionId];
        return r;
      }
      return request;
    };
    this._storePlaybackPosition = function(sessionId, position)
    {
      log.trace("_storePlaybackPosition");
      var message = new ZosaRequestMessage(_protocol.Actions.STORE_PLAYBACK_POSITION, requestId);
      message.sessionId = sessionId;
      if (position != null) { message.lastPlaybackPosition = position; }
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        return r;
      }
      return request;
    };
    this.validatePassword = function(params)
    {
      log.trace("validatePassword");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.VALIDATE_PASSWORD, requestId);
      message.passwordType = params.passwordType;
      message.password = params.password;
      return makeRequest(message);
    };
    this.changePassword = function(params)
    {
      log.trace("changePassword");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.CHANGE_PASSWORD, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.passwordType = params.passwordType;
      message.oldPassword = params.oldPassword;
      message.newPassword = params.newPassword;
      return makeRequest(message);
    };
    this.resetPassword = function(params)
    {
      log.trace("resetPassword");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.RESET_PASSWORD, requestId);
      message.profileId = toItemId(params.profile);
      message.passwordType = params.passwordType;
      message.newPassword = params.newPassword;
      return makeRequest(message);
    };
    this.search = function(params)
    {
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SEARCH, requestId);
      if (params.searchString != null) { message.searchString = params.searchString; }
      if (params.contentTypes != null) { message.contentTypes = params.contentTypes; }
      if (params.searchFields != null) { message.searchFields = params.searchFields; }
      if (params.onlyAllowedParentalRating != null) { message.onlyAllowedParentalRating = params.onlyAllowedParentalRating; }
      if (params.programCatchUpFilter != null) { message.programCatchUpFilter = params.programCatchUpFilter; }
      if (params.programPpvFilter != null) { message.programPpvFilter = params.programPpvFilter; }
      if (params.vodSeriesFilter != null) { message.vodSeriesFilter = params.vodSeriesFilter; }
      if (params.vodSeasonFilter != null) { message.vodSeasonFilter = params.vodSeasonFilter; }
      if (params.offset != null) { message.offset = params.offset; }
      if (params.limit != null) { message.limit = params.limit; }
      return makeRequest(message);
    };
    this.getOffers = function(params) {
      log.trace("getOffers");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_OFFERS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.content != null) { message.contentId = toItemId(params.content); }
      if (params.contentType != null) { message.contentType = params.contentType; }
      if (params.offers != null) { message.offerIds = toItemIds(params.offers); }
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.getAllowedStatus = function(params)
    {
        log.trace("getAllowedStatus");
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.GET_ALLOWED_STATUS, requestId);
        if (params.content != null) { message.contentId = toItemId(params.content); }
        message.itemFields = params.itemFields ? params.itemFields : [];
        return makeRequest(message);
    };
    this.subscribeOffer = function(params) {
      log.trace("subscribeOffer");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SUBSCRIBE_OFFER, requestId);
      message.offerId = toItemId(params.offer);
      return makeRequest(message);
    }
    this.unsubscribeOffer = function(params) {
      log.trace("unsubscribeOffer");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.UNSUBSCRIBE_OFFER, requestId);
      message.offerId = toItemId(params.offer);
      message.ticketId = toItemId(params.ticket);
      return makeRequest(message);
    }
    this.getTickets = function(params) {
      log.trace("getTickets");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_TICKETS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.profile != null) { message.profileId = toItemId(params.profile); }
      if (params.onlyNotPeriodicSubscription != null) { message.onlyNotPeriodicSubscription = params.onlyNotPeriodicSubscription; }
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.getRecordings = function(params) {
      log.trace("getRecordings");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_RECORDINGS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.offset = params.offset;
      message.limit = params.limit;
      message.sortOrder = params.sortOrder;
      if (params.genres != null) { message.genreIds = toItemIds(params.genres); }
      if (params.recordingType != null) { message.recordingType = params.recordingType; }
      if (params.recordings != null) { message.recordingIds = toItemIds(params.recordings); }
      if (params.devices != null) { message.deviceIds = toItemIds(params.devices); }
      if (params.state != null) { message.state = params.state; }
      if (params.onlyNotWatched != null) { message.onlyNotWatched = params.onlyNotWatched; }
      if (params.parentRecording != null) { message.parentRecordingId = toItemId(params.parentRecording); }
      if (params.externalRecordingIds != null) { message.externalRecordingIds = params.externalRecordingIds; }
      if (params.externalRecordingIdType != null) { message.externalRecordingIdType = params.externalRecordingIdType; }
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.getParentRecordings = function(params) {
      log.trace("getParentRecordings");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_PARENT_RECORDINGS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.scheduleProgramRecording = function(params) {
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SCHEDULE_PROGRAM_RECORDING, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.type = params.type;
      message.programId = toItemId(params.program);
      message.channelId = toItemId(params.channel);
      if (params.isSeries != null) { message.isSeries = params.isSeries; }
      if (params.episodeSelection != null) { message.episodeSelection = params.episodeSelection; }
      if (params.sourceUrl != null) { message.sourceUrl = params.sourceUrl; }
      if (params.name != null) { message.name = params.name; }
      if (params.description != null) { message.description = params.description; }
      if (params.device != null) { message.deviceId = toItemId(params.device); }
      if (params.startMargin != null) { message.startMargin = params.startMargin; }
      if (params.endMargin != null) { message.endMargin = params.endMargin; }
      if (params.priority != null) { message.priority = params.priority };
      if (params.videoDefinition != null) { message.videoDefinition = params.videoDefinition; }
      if (params.source != null) { message.source = params.source; }
      if (params.deleteMode != null) { message.deleteMode = params.deleteMode };
      if (params.retainEpisodesCount != null) { message.retainEpisodesCount = params.retainEpisodesCount };
      if (params.useTimeshiftBuffer != null) { message.useTimeshiftBuffer = params.useTimeshiftBuffer };
      if (params.recurEndTime != null) { message.recurEndTime = params.recurEndTime };
      return makeRequest(message);
    }
    this.scheduleIntervalRecording = function(params) {
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SCHEDULE_INTERVAL_RECORDING, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.type = params.type;
      message.channelId = toItemId(params.channel);
      message.startTime = toItemTime(params.startTime);
      message.endTime = toItemTime(params.endTime);
      if (params.sourceUrl != null) { message.sourceUrl = params.sourceUrl; }
      if (params.name != null) { message.name = params.name; }
      if (params.description != null) { message.description = params.description; }
      if (params.device != null) { message.deviceId = toItemId(params.device); }
      if (params.startMargin != null) { message.startMargin = params.startMargin; }
      if (params.endMargin != null) { message.endMargin = params.endMargin; }
      if (params.priority != null) { message.priority = params.priority };
      if (params.videoDefinition != null) { message.videoDefinition = params.videoDefinition; }
      if (params.source != null) { message.source = params.source; }
      if (params.isPeriodic != null) { message.isPeriodic = params.isPeriodic; }
      if (params.recurType != null) { message.recurType = params.recurType; }
      if (params.recurMask != null) { message.recurMask = params.recurMask; }
      if (params.recurEndStyle != null) { message.recurEndStyle = params.recurEndStyle; }
      if (params.recurEndTime != null) { message.recurEndTime = toItemTime(params.recurEndTime); }
      if (params.recurNumRepetitions != null) { message.recurNumRepetitions = params.recurNumRepetitions };
      if (params.deleteMode != null) { message.deleteMode = params.deleteMode };
      if (params.retainEpisodesCount != null) { message.retainEpisodesCount = params.retainEpisodesCount };
      if (params.useTimeshiftBuffer != null) { message.useTimeshiftBuffer = params.useTimeshiftBuffer };
      return makeRequest(message);
    }
    this.updateRecordingConflict = function(params) {
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.UPDATE_RECORDING_CONFLICT, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        message.conflictId = params.conflictId;
        message.conflictGroup = params.conflictGroup;
        return makeRequest(message);
    }
    this.deleteMarkedRecordingConflicts = function(params) {
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(
            _protocol.Actions.DELETE_MARKED_RECORDING_CONFLICTS, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        message.conflictId = params.conflictId;
        return makeRequest(message);
    }
    this.getNextRecordingConflict = function(params) {
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.GET_NEXT_RECORDING_CONFLICT, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        message.conflictId = params.conflictId;
        return makeRequest(message);
    }
    this.autoSolveRecordingConflicts = function(params) {
        if (!params) { params = { }; }
        var message = new ZosaRequestMessage(_protocol.Actions.AUTO_SOLVE_RECORDING_CONFLICTS, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        message.conflictId = params.conflictId;
        return makeRequest(message);
    }
    this.updateRecording = function (params) {
      log.trace("updateRecording");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.UPDATE_RECORDING, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.recordingId = toItemId(params.recording);
      if (params.startTime != null) { message.startTime = toItemTime(params.startTime); }
      if (params.endTime != null) { message.endTime = toItemTime(params.endTime); }
      if (params.startMargin != null) { message.startMargin = params.startMargin; }
      if (params.endMargin != null) { message.endMargin = params.endMargin; }
      if (params.priority != null) { message.priority = params.priority; }
      if (params.stop != null) { message.stop = params.stop; }
      if (params.name != null) { message.name = params.name; }
      if (params.description != null) { message.description = params.description; }
      if (params.videoDefinition != null) { message.videoDefinition = params.videoDefinition; }
      if (params.source != null) { message.source = params.source; }
      if (params.deleteMode != null) { message.deleteMode = params.deleteMode };
      if (params.recordingType != null) { message.recordingType = params.recordingType; }
      if (params.device != null) { message.deviceId = toItemId(params.device); }
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.updateParentRecording = function (params) {
        if (!params) { params = {}; }
        var message = new ZosaRequestMessage(_protocol.Actions.UPDATE_PARENT_RECORDING, requestId);
        message.serviceProviderId = toItemId(params.serviceProvider);
        message.recordingId = toItemId(params.recording);
        if (params.deleteMode != null) { message.deleteMode = params.deleteMode; }
        if (params.retainEpisodesCount != null) { message.retainEpisodesCount = params.retainEpisodesCount; }
        if (params.startMargin != null) { message.startMargin = params.startMargin; }
        if (params.endMargin != null) { message.endMargin = params.endMargin; }
        if (params.videoDefinition != null) { message.videoDefinition = params.videoDefinition; }
        if (params.source != null) { message.source = params.source; }
        if (params.startTime != null) { message.startTime = toItemTime(params.startTime); }
        if (params.endTime != null) { message.endTime = toItemTime(params.endTime); }
        if (params.recordingType != null) { message.recordingType = params.recordingType; }
        if (params.device != null) { message.deviceId = toItemId(params.device); }
        message.itemFields = params.itemFields ? params.itemFields : [];
        if (params.recurEndTime != null) { message.recurEndTime = params.recurEndTime };
        if (params.episodeSelection != null) { message.episodeSelection = params.episodeSelection };
        return makeRequest(message);
    }
    this.removeRecordings = function (params) {
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.REMOVE_RECORDINGS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.recordings != null) {
        message.recordingIds = toItemIds(params.recordings);
      }
      else {
        if (params.type != null) { message.type = params.type; }
        if (params.state != null) { message.state = params.state; }
        if (params.parentRecording != null) { message.parentRecordingId = toItemId(params.parentRecording); }
      }
      return makeRequest(message);
    }
    this.getRecordingConflicts = function (params) {
      log.trace("getRecordingConflicts");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_RECORDING_CONFLICTS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.recordingId = toItemId(params.recording);
      return makeRequest(message);
    }
    this.getDevices = function(params) {
      log.trace("getDevices");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_DEVICES, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.offset = params.offset;
      message.limit = params.limit;
      if (params.deviceTypes != null) { message.deviceTypes = params.deviceTypes; }
      if (params.devices != null) { message.deviceIds = toItemIds(params.devices); }
      message.itemFields = params.itemFields ? params.itemFields : [];
      message.onlyCurrentDevice = params.onlyCurrentDevice;
      return makeRequest(message);
    }
    this.updateDevice = function (params) {
      log.trace("updateDevice");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.UPDATE_DEVICE, requestId);
      message.deviceId = toItemId(params.device);
      if (params.name != null) { message.name = params.name; }
      return makeRequest(message);
    }
    this.getRecordingSpaceInfo = function(params) {
      log.trace("getRecordingSpaceInfo");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_RECORDING_SPACE_INFO, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.recordingSpaceType != null) { message.recordingSpaceType = params.recordingSpaceType; }
      if (params.devices != null) { message.deviceIds = toItemIds(params.devices); }
      return makeRequest(message);
    }
    this.getRecommendations = function(params) {
      log.trace("getRecommendations");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_RECOMMENDATIONS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.scenario = params.scenario;
      if (params.content != null) { message.contentId = toItemId(params.content); }
      if (params.contentTypes != null) { message.contentTypes = params.contentTypes; }
      if (params.onlyAllowedParentalRating != null) { message.onlyAllowedParentalRating = params.onlyAllowedParentalRating; }
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.getMediaPersons = function(params) {
      log.trace("getMediaPersons");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_MEDIA_PERSONS, requestId);
      if (params.mediaPersons != null) { message.mediaPersonIds = toItemId(params.mediaPersons); }
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.getAutocompletions = function(params) {
      log.trace("getAutocompletions");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_AUTOCOMPLETIONS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.searchString = params.searchString;
      message.limit = params.limit;
      return makeRequest(message);
    }
    this.reportUsageEvent = function(params) {
      log.trace("reportUsageEvent");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.REPORT_USAGE_EVENT, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.eventId = params.eventId;
      message.eventInfo = params.eventInfo;
      return makeRequest(message);
    }
    this.getVasItems = function(params) {
      log.trace("getVasItems");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_VAS_ITEMS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.vasItems != null) {
        message.vasIds = toItemIds(params.vasItems);
      }
      if (params.externalVasIds != null) {
        message.externalVasIds = params.externalVasIds;
      }
      if (params.category != null) {
        message.categoryId = toItemId(params.category);
      }
      if (params.externalVasIdType != null) {
        message.externalVasIdType = params.externalVasIdType;
      }
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    }
    this.lock = function(params)
    {
      log.trace("lock");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.LOCK, requestId);
      if (params.contents != null) { message.contentIds = toItemIds(params.contents); }
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    };
    this.unlock = function(params)
    {
      log.trace("unlock");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.UNLOCK, requestId);
      if (params.contents != null) { message.contentIds = toItemIds(params.contents); }
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    };
    this.getPlaybackHistory = function(params)
    {
      log.trace("getPlaybackHistory");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_PLAYBACK_HISTORY, requestId);
      if (params.contentTypes != null) { message.contentTypes = params.contentTypes; }
      if (params.sortOrder != null) { message.sortOrder = params.sortOrder; }
      message.serviceProviderId = toItemId(params.serviceProvider);
      message.offset = params.offset;
      message.limit = params.limit;
      message.itemFields = params.itemFields ? params.itemFields : [];
      return makeRequest(message);
    };
    this.getSubscriberInfo = function(params)
    {
      log.trace("getSubscriberInfo");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_SUBSCRIBER_INFO, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    };
    this.getParentalBlockingStatus = function(params)
    {
      log.trace("getParentalBlockingStatus");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_PARENTAL_BLOCKING_STATUS, requestId);
      if (params.content != null) { message.contentId = toItemId(params.content); }
      message.scenario = params.scenario;
      message.scenarioIsAdult = params.scenarioIsAdult;
      return makeRequest(message);
    };
    this.parentalUnblock = function(params)
    {
      log.trace("parentalUnblock");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.PARENTAL_UNBLOCK, requestId);
      if (params.content != null) { message.contentId = toItemId(params.content); }
      message.scenario = params.scenario;
      message.scenarioIsAdult = params.scenarioIsAdult;
      message.timeout = params.timeout;
      message.password = params.password;
      return makeRequest(message);
    };
    this.resetParentalUnblocking = function(params)
    {
      log.trace("resetParentalUnblocking");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.RESET_PARENTAL_UNBLOCKING, requestId);
      if (params.content != null) { message.contentId = toItemId(params.content); }
      message.scenario = params.scenario;
      message.scenarioIsAdult = params.scenarioIsAdult;
      return makeRequest(message);
    };
    this.getBandwidthInfo = function(params)
    {
      log.trace("getBandwidthInfo");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_BANDWIDTH_INFO, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      return makeRequest(message);
    };
    this.releaseBandwidthBookings = function(params)
    {
      log.trace("releaseBandwidthBookings");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.RELEASE_BANDWIDTH_BOOKINGS, requestId);
      message.bandwidthBookingIds = toItemIds(params.bandwidthBookings);
      return makeRequest(message);
    };
    function ZosaCustomApi(zosa, apiId)
    {
      var that = this;
      var onCustomApiEvent = function (message) { log.trace("custom API event"); };
      this.call = function(params)
      {
        log.trace("call");
        if (!params) { params = { }; }
        return zosa._customApiCall(apiId, params);
      }
      this.destroy = function()
      {
        return zosa._destroyCustomApi(apiId);
      };
      this.setOnCustomApiEvent = function(func)
      {
        onCustomApiEvent = func;
        return that;
      };
      this._fireOnCustomApiEvent = function(properties)
      {
        if (onCustomApiEvent != null) {
          try {
            onCustomApiEvent(properties);
          }
          catch (e) {
            log.exception(e);
          }
        }
      };
    }
    this.createCustomApi = function(params)
    {
      log.trace("createCustomApi");
      var message = new ZosaRequestMessage(_protocol.Actions.CREATE_CUSTOM_API, requestId);
      message.apiName = params.apiName;
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        var api = new ZosaCustomApi(that, r.apiId);
        customApis[r.apiId] = api;
        return api;
      }
      return request;
    };
    this._customApiCall = function(apiId, params)
    {
      log.trace("_customApiCall");
      var message = new ZosaRequestMessage(_protocol.Actions.CALL_CUSTOM_API, requestId);
      message.apiId = apiId;
      if (params.functionName != null) { message.functionName = params.functionName; }
      if (params.input != null) { message.input = params.input; }
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        return r;
      }
      return request;
    };
    this._destroyCustomApi = function(apiId)
    {
      log.trace("_destroyCustomApi");
      var message = new ZosaRequestMessage(_protocol.Actions.DESTROY_CUSTOM_API, requestId);
      message.apiId = apiId;
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        delete customApis[apiId];
        return r;
      }
      return request;
    };
    this.getItems = function(params) {
      log.trace("getItems");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.GET_ITEMS, requestId);
      message.serviceProviderId = toItemId(params.serviceProvider);
      if (params.items != null) {
        message.itemIds = toItemIds(params.items);
      }
      return makeRequest(message);
    }
    this.setUserScore = function(params) {
      log.trace("setUserScore");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.SET_USER_SCORE, requestId);
      if (params.content != null) { message.contentId = toItemId(params.content); }
      if (params.userScore != null) { message.userScore = params.userScore; }
      return makeRequest(message);
    }
    this.createProgramsUpdatedObserver = function(params)
    {
      log.trace("createProgramsUpdatedObserver");
      var message = new ZosaRequestMessage(_protocol.Actions.CREATE_PROGRAMS_UPDATED_OBSERVER, requestId);
      if (params.observedRegions != null) { message.observedRegions = params.observedRegions; }
      if (params.pollingPeriod != null) { message.pollingPeriod = params.pollingPeriod; }
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        var programsUpdatedObserver = new ZosaProgramsUpdatedObserver(that, r.observerId);
        programsUpdatedObservers[r.observerId] = programsUpdatedObserver;
        return programsUpdatedObserver;
      }
      return request;
    };
    this.destroyProgramsUpdatedObserver = function(observerId)
    {
      log.trace("destroyProgramsUpdatedObserver");
      var message = new ZosaRequestMessage(_protocol.Actions.DESTROY_PROGRAMS_UPDATED_OBSERVER, requestId);
      message.observerId = observerId;
      var request = makeRequest(message);
      request._prepareResponse = function (r) {
        delete programsUpdatedObservers[observerId];
        return r;
      }
      return request;
    };
    this.resetAllParentalUnblockings = function(params)
    {
      log.trace("resetAllParentalUnblockings");
      if (!params) { params = { }; }
      var message = new ZosaRequestMessage(_protocol.Actions.RESET_ALL_PARENTAL_UNBLOCKINGS, requestId);
      return makeRequest(message);
    };
    function fireSessionError(event) {
      if (onSessionError != null) {
        try {
          onSessionError(event);
        }
        catch (e) {
          log.exception(e);
        }
      }
    }
    function zosaLogin()
    {
      log.trace("login");
      if (sessionState != SESSION_STATE_CONNECTED) {
        throw "session state error";
      }
      setSessionState(SESSION_STATE_LOGGING_IN);
      zosaLoginRequestId = requestId;
      var message = new ZosaRequestMessage(_protocol.Actions.ZOSA_LOGIN, requestId);
      message.protocol = "zosa";
      message.clientVersion = protocolVersion;
      message.username = zosaUsername;
      message.password = zosaPassword;
      return makeRequest(message);
    }
    function onWebsocketOpen(evt)
    {
      log.trace("connected");
      setSessionState(SESSION_STATE_CONNECTED);
      var rev = new ZosaRequestResponseEvent();
      zosaConnectRequest._fireSuccess(rev);
    }
    function onWebsocketClose(evt)
    {
      log.trace("onWebsocketClose");
      var tmpSessionState = sessionState;
      setSessionState(SESSION_STATE_DISCONNECTED);
      var eev = new ZosaErrorEvent();
      eev.error = new ZosaError();
      eev.error.code = that.COMMUNICATION_ERROR;
      eev.error.message = "zosa connection closed unexpectedly";
      for (var requestKey in requests) {
        try {
          requests[requestKey]._fireFailure(eev);
        } catch (e) {
          log.trace("request handler throwed exception: " + e);
        }
      }
      requests = { };
      if (tmpSessionState != SESSION_STATE_DISCONNECTED) {
        fireSessionError(eev);
      }
    }
    function onWebsocketMessage(evt)
    {
      log.trace("Received: " + evt.data);
      var message = JSON.parse(evt.data);
      if ((_protocol.RequestFields.REQUEST_ID in message) && message.requestId != null) {
        if (typeof requests[message.requestId] === "undefined") {
          log.trace("No request found for id " + message.requestId);
          return;
        }
        var request = requests[message.requestId];
        if ((_protocol.RequestFields.ERROR in message) && message.error != null && message.error.code != 0) {
          var eev = new ZosaErrorEvent();
          eev.error = message.error;
          request._fireFailure(eev);
        }
        else {
          if (sessionState == SESSION_STATE_LOGGING_IN && message.requestId == zosaLoginRequestId) {
            setSessionState(SESSION_STATE_LOGGED_IN);
          }
          var event = new ZosaRequestResponseEvent();
          event.response = message.response;
          request._fireSuccess(event);
        }
        delete requests[message.requestId];
      }
      else if ((_protocol.EventFields.EVENT_TYPE in message) && message.eventType != null) {
        if (message.eventType == EVENT_TYPE_REMINDER) {
          var reminderEvent = { reminder : message.reminder };
          onReminder(reminderEvent);
        }
        else if (message.eventType == EVENT_TYPE_RECORDING_CHANGED) {
          var recordingChangedEvent = { recordingId : message.recordingId,
                                        serviceProviderId : message.serviceProviderId };
          onRecordingChanged(recordingChangedEvent);
        }
        else if (message.eventType == EVENT_TYPE_RECORDING_BANDWIDTH_CONFLICT) {
          var recordingBandwidthConflictEvent = { recordingId : message.recordingId};
          onRecordingBandwidthConflict(recordingBandwidthConflictEvent);
        }
        else if (message.eventType == EVENT_TYPE_PLAYBACK_SESSION_STOPPED) {
            var session = playbackSessions[message.sessionId];
            if (typeof session !== "undefined") {
              var event = { reason : message.reason };
              session._fireOnStopPlayback(event);
            }
        } else if (message.eventType == EVENT_TYPE_PLAYBACK_SESSION_CUSTOM_PROPERTIES_UPDATED) {
            var session = playbackSessions[message.sessionId];
            if (typeof session !== "undefined") {
             session._fireOnUpdateCustomProperties(message.properties);
            }
        } else if (message.eventType == EVENT_TYPE_CUR_UPDATED) {
            var session = playbackSessions[message.sessionId];
            if (typeof session !== "undefined") {
             session._fireOnUpdateCur(message.cur);
            }
        } else if (message.eventType == EVENT_TYPE_MESSAGE) {
          var event = { message : message.message };
          onMessage(event);
        } else if (message.eventType == EVENT_TYPE_DATA_UPDATED) {
          onDataUpdated(message);
        } else if (message.eventType == EVENT_TYPE_SERVICE_PROVIDER_SESSION_ERROR) {
         message.errorCode = message.error.code;
            message.code = message.error.code;
            message.message = message.error.message;
            onServiceProviderSessionError(message);
        } else if (message.eventType == EVENT_TYPE_PARENTAL_BLOCKING_CHANGED) {
          onParentalBlockingChanged(message);
        } else if (message.eventType == EVENT_TYPE_CUSTOM_API) {
          var api = customApis[message.apiId];
          if(typeof api !== "undefined") {
            api._fireOnCustomApiEvent(message.properties);
          }
        } else if (message.eventType == EVENT_TYPE_PROGRAMS_UPDATED) {
            var observer = programsUpdatedObservers[message.observerId];
            observer._fireOnProgramsUpdated(message.updatedRegions);
        }
      }
    }
    function onWebsocketError(evt)
    {
      log.error("onWebsocketError");
      if (sessionState == SESSION_STATE_CONNECTING) {
        setSessionState(SESSION_STATE_DISCONNECTED);
        var eev = new ZosaErrorEvent();
        eev.error = new ZosaError();
        eev.error.code = that.COMMUNICATION_ERROR;
        eev.error.message = "zosa connection failure";
        zosaConnectRequest._fireFailure(eev);
      }
      else {
        var eev = new ZosaErrorEvent();
        eev.error = new ZosaError();
        eev.error.code = that.COMMUNICATION_ERROR;
        eev.error.message = "zosa connection failure";
        fireSessionError(eev);
      }
    }
    function makeRequest(message)
    {
      log.trace("Sending: " + message);
      var request = new ZosaRequest(that, log);
      try {
        if (sessionState == SESSION_STATE_DISCONNECTED || !webSocket) {
          throw "zosa connection not open";
        }
        var ok = webSocket.send(message);
        if (typeof(ok) !== "undefined" && !ok) {
          throw "websocket not open";
        }
        request.requestId = requestId;
        requests[requestId] = request;
        ++requestId;
      }
      catch (e) {
        log.trace("makeRequest failed");
        setTimeout(function () {
          var eev = new ZosaErrorEvent();
          eev.error = new ZosaError();
          eev.error.code = that.COMMUNICATION_ERROR;
          eev.error.message = "sending request failed: " + e;
          var tmpSessionState = sessionState;
          setSessionState(SESSION_STATE_DISCONNECTED);
          request._fireFailure(eev);
          if (tmpSessionState != SESSION_STATE_DISCONNECTED) {
            fireSessionError(eev);
          }
        }, 0);
      }
      return request;
    }
    function makeConnectAndLoginRequest()
    {
      var request = new ZosaRequest(that, log);
      ++requestId;
      return request;
    }
    function makeConnectRequest()
    {
      zosaConnectRequest = new ZosaRequest(that, log);
      ++requestId;
      return zosaConnectRequest;
    }
    function connect()
    {
      log.trace("connect: url=" + zosaUrl);
      setSessionState(SESSION_STATE_CONNECTING);
      try {
        if (webSocket != null) {
            webSocket.close();
        }
        webSocket = new WebSocket(zosaUrl);
      } catch (e) {
          setTimeout(function () {
            onWebsocketError();
          }, 0);
          return makeConnectRequest();
      }
      webSocket.onopen = onWebsocketOpen;
      webSocket.onclose = onWebsocketClose;
      webSocket.onmessage = onWebsocketMessage;
      webSocket.onerror = onWebsocketError;
      return makeConnectRequest();
    };
    function init()
    {
      log.trace("init");
      setSessionState(SESSION_STATE_DISCONNECTED);
    }
    function term()
    {
      requests = { };
      requestId = 1;
      zosaUrl = null;
      zosaUsername = null;
      zosaPassword = null;
      if (webSocket != null) {
        webSocket.close();
        webSocket = null;
      }
    }
    function setSessionState(newState)
    {
      log.trace("Zosa session state changed: " + sessionState + " -> " + newState);
      sessionState = newState;
    }
    init();
  }
  return Zosa;
})();
