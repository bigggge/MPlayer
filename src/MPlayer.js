/**
 * @author bigggge
 *
 * https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLMediaElement
 *
 * @description Media Event
 * @link https://developer.mozilla.org/zh-CN/docs/Web/Guide/Events/Media_events
 *
 */

!function () {

    // template
    var audioHtml = `<div class="player">
    <div class="player-cover">
        <div class="player-cover-wrapper">
            <img class="player-cover-img">
        </div>
    </div>

    <div class="player-main">
        <div class="player-info">
            <span class="player-title"></span>
            <span class="player-author"></span>
        </div>

        <div class="player-controller">
            <span class="togglePlay icon-play2"></span>
        </div>

        <div class="player-time">
            <div class="time-bar-wrapper">
                <div class="total-time-bar"><span class="played-time-bar"></span></div>
            </div>
            <span class="time-text">
                <span class="played-time">00:00</span> / <span class="total-time">3:00</span>
            </span>
        </div>
    </div>
</div>`

    function MPlayer(options) {
        this.options = options;
        this.init()
    }

    MPlayer.prototype.init = function () {

        this.el = document.getElementById(options.el);
        let options = this.options;
        let src = options.src;
        let autoPlay = options.autoplay;
        let cover = options.cover;
        this.el.innerHTML = audioHtml;

        // DOM
        let el = this.el;
        this.togglePlayEl = el.getElementsByClassName('togglePlay')[0];
        this.titleEl = el.getElementsByClassName('player-title')[0];
        this.authorEl = el.getElementsByClassName('player-author')[0];
        this.totalTimeEl = el.getElementsByClassName('total-time')[0];
        this.playedTimeEl = el.getElementsByClassName('played-time')[0];
        this.playerCoverEl = el.getElementsByClassName('player-cover-img')[0];
        this.persentPlayed = el.getElementsByClassName('played-time-bar')[0];

        // song title
        this.titleEl.innerHTML = options.title;
        // song author
        this.authorEl.innerHTML = options.author;
        // song cover
        this.playerCoverEl.src = options.cover;


        // play or pause
        this.togglePlayEl.addEventListener('click', () => {
            this.toggle();
        });

        // audio
        this.audio = document.createElement('audio');
        this.audio.src = src;

        // total time
        this.audio.addEventListener('durationchange', () => {
            this.totalTimeEl.innerHTML = secondToTime(this.audio.duration);
        });

        // error listener
        this.audio.addEventListener('error', () => {
            this.authorEl.classList.add('error');
            this.authorEl.innerHTML = '加载失败 T^T';
        });

        // auto play
        if (autoPlay) {
            this.toggle();
        }
    };

    /**
     * play or pause
     */
    MPlayer.prototype.toggle = function () {
        if (this.audio.paused) {
            this.togglePlayEl.classList.add('icon-pause');
            this.togglePlayEl.classList.remove('icon-play2');
            this.audio.play();

            this.playedTime = setInterval(() => {
                this.playedTimeEl.innerHTML = secondToTime(this.audio.currentTime);
                this.persentPlayed.style.width = (this.audio.currentTime / this.audio.duration) * 100 + '%'
            }, 100);

        } else {
            this.togglePlayEl.classList.add('icon-play2');
            this.togglePlayEl.classList.remove('icon-pause');
            this.audio.pause();
            clearInterval(this.playedTime)
        }
    };

    /**
     * second to 00:00
     *
     * @param second
     * @return {string}
     */
    function secondToTime(second) {
        let min = (second / 60) | 0;
        let sec = (second % 60) | 0;
        let add0min = min < 10 ? ('0' + min) : min
        let add0sec = sec < 10 ? ('0' + sec) : sec
        return `${add0min}:${add0sec}`;
    }

    window.MPlayer = MPlayer

}();