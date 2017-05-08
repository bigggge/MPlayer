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
    let audioHtml = `
        <div class="player">
            <div class="player-cover">
                <img class="player-cover-img">
            </div>

            <div class="player-main">
                <div class="player-info">
                    <span class="player-title"></span>
                    <span class="player-author"></span>
                    <span class="player-loading">loading...</span>
                </div>

                <div class="player-controller">
                    <span class="player-toggle icon-play2"></span>
                    <span class="player-lrc"></span>
                </div>

                <div class="player-bottom-bar">
                    <div class="time-bar">
                        <div class="total-time-bar"><span class="played-time-bar"></span></div>
                    </div>
                    <span class="time-text">
                <span class="played-time">00:00</span>/<span class="total-time">3:00</span>
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

        this.el.innerHTML = audioHtml;

        // DOM
        const el = this.el;
        this.toggleEl = el.getElementsByClassName('player-toggle')[0];
        this.lrcEl = el.getElementsByClassName('player-lrc')[0];
        this.titleEl = el.getElementsByClassName('player-title')[0];
        this.authorEl = el.getElementsByClassName('player-author')[0];
        this.loadingEl = el.getElementsByClassName('player-loading')[0];
        // time bar
        this.timeBarEl = el.getElementsByClassName('time-bar')[0];
        this.totalTimeEl = el.getElementsByClassName('total-time')[0];
        this.playedTimeEl = el.getElementsByClassName('played-time')[0];
        this.playerCoverEl = el.getElementsByClassName('player-cover')[0];
        this.playerCoverImgEl = el.getElementsByClassName('player-cover-img')[0];
        this.persentPlayedEl = el.getElementsByClassName('played-time-bar')[0];
        // volume
        this.playerVolumeEl = el.getElementsByClassName('player-volume-icon')[0];
        this.volumeBarEl = el.getElementsByClassName('player-volume-bar')[0];
        this.totalVolumeEl = el.getElementsByClassName('total-volume-bar')[0];
        this.currentVolumeEl = el.getElementsByClassName('current-volume-bar')[0];
        // music list
        this.playerListEl = el.getElementsByClassName('player-list')[0];
        this.musicListEl = el.getElementsByClassName('music-list')[0];
        this.musicItemEls = el.getElementsByClassName('music-item');

        if (!Array.isArray(this.musicList) || this.musicList.length === 0) {
            this.loadingEl.classList.add('error');
            this.loadingEl.innerHTML = '参数错误 T^T';
            return;
        }

        this.currentMusic = this.musicList[0];
        // lrc
        this.parseLrc(this.currentMusic.lrc);
        // generate music list
        let html = '';
        for (let i = 0; i < this.musicList.length; i++) {
            html += `<li class="music-item">${this.musicList[i].title} <span class="music-author">${this.musicList[i].author}</span></li>`;
        }
        this.musicListEl.innerHTML = html;
        this.musicItemEls[0].className = 'music-item active';

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
            this.audio.play();
            this.toggleEl.className = 'player-toggle icon-pause';
            this.currentVolumeEl.style.height = this.audio.volume * 100 + '%';
        } else {
            this.audio.pause();
            this.toggleEl.className = 'player-toggle icon-play2';
        }
    };

    /**
     * set music
     */
    MPlayer.prototype.setMusic = function (forcePlay) {
        this.loadingEl.innerHTML = 'loading...';
        // lrc
        this.parseLrc(this.currentMusic.lrc);
        // song
        this.audio.src = this.currentMusic.src;
        // song cover
        this.playerCoverImgEl.src = this.currentMusic.cover;
        // song title
        this.titleEl.innerHTML = this.currentMusic.title;
        // song author
        this.authorEl.innerHTML = this.currentMusic.author;
        forcePlay && this.toggle(forcePlay)
    };

    MPlayer.prototype._addEventListener = function () {

        // play or pause
        this.toggleEl.addEventListener('click', () => {
            this.toggle();
        });

        // total time
        this.audio.addEventListener('durationchange', () => {
            this.totalTimeEl.innerHTML = _secondToTime(this.audio.duration);
        });

        // can play
        this.audio.addEventListener('canplaythrough', () => {
            this.loadingEl.innerHTML = ''
        });

        this.audio.addEventListener('playing', () => {
            this.loadingEl.innerHTML = '';
            this.playerCoverEl.style.animationPlayState = "running";
        });

        this.audio.addEventListener('pause', () => {
            this.loadingEl.innerHTML = '';
            this.playerCoverEl.style.animationPlayState = "paused";
        });

        // music end
        this.audio.addEventListener('ended', () => {
            this.toggleEl.className = 'player-toggle icon-play2';
        });

        // time update
        this.audio.addEventListener('timeupdate', () => {
            this.playedTimeEl.innerHTML = _secondToTime(this.audio.currentTime);
            this.persentPlayedEl.style.width = (this.audio.currentTime / this.audio.duration) * 100 + '%';
            this.lrcEl.innerHTML = getLrc(this.currentLrc, this.audio.currentTime);
        });

        // error listener
        this.audio.addEventListener('error', () => {
            this.loadingEl.classList.add('error');
            this.loadingEl.innerHTML = '加载失败 T^T';
            this.playerCoverEl.style.animationPlayState = "paused";
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
            this.playedTimeEl.innerHTML = _secondToTime(this.audio.currentTime);
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
        });

        // music list
        this.musicListEl.addEventListener('click', (e) => {
            for (let i = 0; i < this.musicItemEls.length; i++) {
                this.musicItemEls[i].classList.remove('active')
            }
            if (e.target && (e.target.nodeName === "LI")) {
                const node = e.target;
                const index = [].indexOf.call(node.parentNode.children, node);
                this.currentMusic = this.musicList[index];
                node.className = 'music-item active';

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
    function _secondToTime(second) {
        let min = parseInt(second / 60);
        let sec = parseInt(second % 60);
        let add0min = min < 10 ? ('0' + min) : min
        let add0sec = sec < 10 ? ('0' + sec) : sec
        return `${add0min}:${add0sec}`;
    }

    MPlayer.prototype.parseLrc = function (lrc) {
        if (!lrc) {
            this.currentLrc = [[0, '']]
        }
        // if lrc is url
        else if (lrc.indexOf('http') === 0) {
            if (window.fetch) {
                console.log('fetch...')
                fetch(lrc)
                    .then((response) => {
                        return response.text();
                    })
                    .then((text) => {
                        this.currentLrc = getParsedLrcArr(text)
                    })
                    .catch(function (err) {
                        console.error(err)
                    });
            } else {
                let request = new XMLHttpRequest();
                request.open('GET', lrc, true);

                request.onload = () => {
                    if (request.status >= 200 && request.status < 400) {
                        let data = request.responseText;
                        this.currentLrc = getParsedLrcArr(data)
                    }
                };
                request.onerror = (err) => {
                    console.log(err)
                };
                request.send();
            }
        }
        // if lrc is text
        else {
            this.currentLrc = getParsedLrcArr(lrc)
        }
    };

    /**
     * 修改自 https://github.com/DIYgod/APlayer/blob/master/src/APlayer.js#L621-L644
     */
    function getParsedLrcArr(text) {
        let lyric = text.split('\n');
        if (lyric.length === 1) {
            lyric = text.split(' ')
        }
        let lrc = [];
        for (let i = 0, lyricLen = lyric.length; i < lyricLen; i++) {
            // match lrc time
            const lrcTimes = lyric[i].match(/\[(\d{2}):(\d{2})\.(\d{2,3})]/g);
            // match lrc text
            const lrcText = lyric[i].replace(/\[(\d{2}):(\d{2})\.(\d{2,3})]/g, '').replace(/^\s+|\s+$/g, '');
            if (lrcTimes !== null) {
                // handle multiple time tag
                const timeLen = lrcTimes.length;
                for (let j = 0; j < timeLen; j++) {
                    const oneTime = /\[(\d{2}):(\d{2})\.(\d{2,3})]/.exec(lrcTimes[j]);
                    const lrcTime = (oneTime[1]) * 60 + parseInt(oneTime[2]) + parseInt(oneTime[3]) / ((oneTime[3] + '').length === 2 ? 100 : 1000);
                    lrc.push([lrcTime, lrcText]);
                }
            }
        }
        // sort by time
        lrc.sort((a, b) => a[0] - b[0]);
        return lrc;
    }

    function getLrc(lrc, time) {
        if (!lrc)return '';
        if (time < lrc[0][0]) return lrc[0][1];
        let i = 0;
        for (let l = lrc.length; i < l; i++) {
            if (time >= lrc[i][0] && (!(lrc[i + 1]) || time <= lrc[i + 1][0])) {
                break;
            }
        }
        return lrc[i][1]
    }

    window.MPlayer = MPlayer

}();