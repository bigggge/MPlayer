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
    var audioHtml = `
        <div class="player">
            <div class="player-cover">
                <div class="player-cover-wrapper">
                    <img class="player-cover-img">
                </div>
            </div>

            <div class="player-main">
                <div class="player-info">
                    <span class="player-title"></span>
                    <span class="player-author"></span>
                    <span class="player-loading">loading...</span>
                </div>

                <div class="player-controller">
                    <span class="togglePlay icon-play2"></span>
                </div>

                <div class="player-bottom-bar">
                    <div class="time-bar">
                        <div class="total-time-bar"><span class="played-time-bar"></span></div>
                    </div>
                    <span class="time-text">
                <span class="played-time">00:00</span> / <span class="total-time">3:00</span>
            </span>
                    <span class="player-volume-icon icon-volume-medium"></span>
                    <div class="player-volume-bar">
                        <div class="total-volume-bar"><span class="current-volume-bar"></span></div>
                    </div>
                </div>
            </div>
            <div class="player-list">
                <ol class="music-list"></ol>
            </div>
        </div>`;

    function MPlayer(options) {
        this.options = options;
        this.init()
    }

    MPlayer.prototype.init = function () {

        const options = this.options;
        this.el = document.getElementById(options.el);
        const autoPlay = options.autoplay;

        this.musicList = options.music;
        this.currentMusic = this.musicList[0];

        this.el.innerHTML = audioHtml;

        // DOM
        const el = this.el;
        this.togglePlayEl = el.getElementsByClassName('togglePlay')[0];
        this.titleEl = el.getElementsByClassName('player-title')[0];
        this.authorEl = el.getElementsByClassName('player-author')[0];
        this.loadingEl = el.getElementsByClassName('player-loading')[0];
        // time bar
        this.timeBarEl = el.getElementsByClassName('time-bar')[0];
        this.totalTimeEl = el.getElementsByClassName('total-time')[0];
        this.playedTimeEl = el.getElementsByClassName('played-time')[0];
        this.playerCoverEl = el.getElementsByClassName('player-cover-img')[0];
        this.persentPlayedEl = el.getElementsByClassName('played-time-bar')[0];
        // volume
        this.playerVolumeEl = el.getElementsByClassName('player-volume-icon')[0];
        this.volumeBarEl = el.getElementsByClassName('player-volume-bar')[0];
        this.totalVolumeEl = el.getElementsByClassName('total-volume-bar')[0];
        this.currentVolumeEl = el.getElementsByClassName('current-volume-bar')[0];
        // music list
        this.playerListEl = el.getElementsByClassName('player-list')[0];
        this.musicListEl = el.getElementsByClassName('music-list')[0];

        // generate music list
        let html = '';
        for (let i = 0; i < this.musicList.length; i++) {
            html += `<li class="music-item">${this.musicList[i].title} <span class="music-author">${this.musicList[i].author}</span></li>`;
        }
        this.musicListEl.innerHTML = html;

        // set music
        this.audio = document.createElement('audio');
        this.setMusic(false);

        // add event listener
        this._addEventListener();

        // auto play
        autoPlay && this.toggle();
    };

    /**
     * play or pause
     */
    MPlayer.prototype.toggle = function (forcePlay) {
        if (forcePlay || this.audio.paused) {
            this.togglePlayEl.className = 'togglePlay icon-pause';
            this.audio.play();
            this.currentVolumeEl.style.height = this.audio.volume * 100 + '%';
        } else {
            this.togglePlayEl.className = 'togglePlay icon-play2';
            this.audio.pause();
        }
    };

    /**
     * set music
     */
    MPlayer.prototype.setMusic = function (forcePlay) {
        this.loadingEl.innerHTML = 'loading...';
        // song
        this.audio.src = this.currentMusic.src;
        // song cover
        this.playerCoverEl.src = this.currentMusic.cover;
        // song title
        this.titleEl.innerHTML = this.currentMusic.title;
        // song author
        this.authorEl.innerHTML = this.currentMusic.author;
        forcePlay && this.toggle(forcePlay)
    };

    MPlayer.prototype._addEventListener = function () {

        // play or pause
        this.togglePlayEl.addEventListener('click', () => {
            this.toggle();
        });

        // total time
        this.audio.addEventListener('durationchange', () => {
            this.totalTimeEl.innerHTML = secondToTime(this.audio.duration);
        });

        // can play
        this.audio.addEventListener('canplaythrough', () => {
            this.loadingEl.innerHTML = ''
        });

        // music end
        this.audio.addEventListener('ended', () => {
            this.togglePlayEl.className = 'togglePlay icon-play2';
        });

        // time update
        this.audio.addEventListener('timeupdate', () => {
            this.playedTimeEl.innerHTML = secondToTime(this.audio.currentTime);
            this.persentPlayedEl.style.width = (this.audio.currentTime / this.audio.duration) * 100 + '%'
        });

        // error listener
        this.audio.addEventListener('error', () => {
            this.loadingEl.classList.add('error');
            this.loadingEl.innerHTML = '加载失败 T^T';
        });

        // progress bar
        this.timeBarEl.addEventListener('click', (e) => {
            const event = e || window.event;
            const timeBarWidth = this.timeBarEl.clientWidth;
            const rect = this.timeBarEl.getBoundingClientRect();
            const viewLeft = rect.left;
            const percentage = ((event.clientX - viewLeft ) / timeBarWidth).toFixed(2);

            this.persentPlayedEl.style.width = percentage * 100 + '%';
            this.audio.currentTime = percentage * this.audio.duration;
            this.playedTimeEl.innerHTML = secondToTime(this.audio.currentTime);
        });

        // volume
        this.playerVolumeEl.addEventListener('click', (e) => {
            if (this.audio.muted) {
                this.audio.muted = false;
                this.playerVolumeEl.className = 'player-volume-icon icon-volume-medium';
                this.currentVolumeEl.style.height = '100%';
            } else {
                this.audio.muted = true;
                this.playerVolumeEl.className = 'player-volume-icon icon-volume-mute2';
                this.currentVolumeEl.style.height = '0%';
            }
        });

        this.volumeBarEl.addEventListener('click', (e) => {
            const event = e || window.event;
            const volumeBarHeight = this.volumeBarEl.clientHeight;
            const rect = this.volumeBarEl.getBoundingClientRect();
            const viewTop = rect.top;
            const percentage = 1 - ((event.clientY - viewTop ) / volumeBarHeight).toFixed(2);

            this.currentVolumeEl.style.height = percentage * 100 + '%';
            this.audio.volume = percentage;
        });

        // show or hide music list
        this.playerCoverEl.addEventListener('click', () => {
            this.playerListEl.style.display = (this.playerListEl.style.display === 'block' ? 'none' : 'block')
            // let classList = this.playerListEl.classList;
            // if (classList.contains('hidden')) {
            //     classList.remove('hidden');
            //     requestAnimationFrame(function () {
            //         classList.remove('visually-hidden');
            //     });
            // } else {
            //     classList.add('visually-hidden');
            //     this.playerListEl.addEventListener('transitionend', (e) => {
            //         classList.add('hidden');
            //     });
            // }
        });

        // music list
        this.musicListEl.addEventListener('click', (e) => {
            if (e.target && (e.target.nodeName === "LI")) {
                const node = e.target;
                const index = [].indexOf.call(node.parentNode.children, node);
                this.currentMusic = this.musicList[index];
                this.setMusic(true);
            }
        });
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