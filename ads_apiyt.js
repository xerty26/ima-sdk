let adsManager;
let adsLoader;
let adDisplayContainer;
let intervalTimer;
let isAdPlaying;
let isContentFinished;
let videoContent;
var videoContentPlayer;
let ids = {
    element: 'contentElement',
    adContainer: 'adContainer',
}
let firstState = false;

/**
 * Initializes IMA setup.
 */

function onYouTubePlayerAPIReady() {
    videoContentPlayer = new YT.Player('contentElement', {
        videoId: 'iJ7H16l0JD8',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log('dentro', event);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING && !firstState) {
        firstState = true;
        videoContentPlayer.stopVideo();
        playAds();
    }
}

/**
 * Sets up IMA ad display container, ads loader, and makes an ad request.
 */
function setUpIMA() {
    createAdDisplayContainer();
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded, false);
    adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

    const contentEndedListener = function () {
        if (isAdPlaying) return;
        isContentFinished = true;
        adsLoader.contentComplete();
    };
    videoContent.onended = contentEndedListener;

    // Request video ads.
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';

    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 400;

    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    adsLoader.requestAds(adsRequest);
}

/**
 * Sets the 'adContainer' div as the IMA ad display container.
 */
function createAdDisplayContainer() {
    adDisplayContainer = new google.ima.AdDisplayContainer(
        document.getElementById(ids.adContainer), videoContent);
}

/**
 * Loads the video content and initializes IMA ad playback.
 */
function playAds() {
    adDisplayContainer.initialize();
    try {
        adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
        adsManager.start();
    } catch (adError) {
        // Error VAST response
    }
}

/**
 * Handles the ad manager loading and sets ad event listeners.
 * @param {!google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
 */
function onAdsManagerLoaded(adsManagerLoadedEvent) {
    // Get the ads manager.
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    // videoContent should be set to the content video element.
    adsManager = adsManagerLoadedEvent.getAdsManager(videoContent, adsRenderingSettings);

    // Add listeners to the required events.
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
    adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);

    // Listen to any additional events, if necessary.
    adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);
}

/**
 * Handles actions taken in response to ad events.
 * @param {!google.ima.AdEvent} adEvent
 */
function onAdEvent(adEvent) {
    const ad = adEvent.getAd();
    switch (adEvent.type) {
        case google.ima.AdEvent.Type.LOADED:
            if (!ad.isLinear()) {
                videoContent.play();
            }
            break;
        case google.ima.AdEvent.Type.STARTED:
            if (ad.isLinear()) {
                intervalTimer = setInterval(
                    function () {
                        // Example: const remainingTime = adsManager.getRemainingTime();
                    },
                    300);  // every 300ms
            }
            break;
        case google.ima.AdEvent.Type.COMPLETE:
            if (ad.isLinear()) {
                clearInterval(intervalTimer);
            }
            break;
    }
}

/**
 * Handles ad errors.
 * @param {!google.ima.AdErrorEvent} adErrorEvent
 */
function onAdError(adErrorEvent) {
    console.log(adErrorEvent.getError());
    //adsManager.destroy();
}

/**
 * Pauses video content and sets up ad UI.
 */
function onContentPauseRequested() {
    isAdPlaying = true;
}

/**
 * Resumes video content and removes ad UI.
 */
function onContentResumeRequested() {
    isAdPlaying = false;
    if (!isContentFinished) {
        videoContentPlayer.playVideo();
        document.getElementById(ids.adContainer).style.display = 'none';
    }
}

// Wire UI element references and UI event listeners.
document.addEventListener('DOMContentLoaded', () => {
    videoContent = document.getElementById(ids.element);
    setUpIMA();
})
