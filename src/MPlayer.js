/**
 *
 * MPlayer.js
 *
 * @version 0.6.0
 * @author bigggge
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
                    <canvas class="player-spectrum" width="220" height="35"></canvas>
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
        </div>`

  // declare new audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const MEDIA_ELEMENT_NODES = new WeakMap()

  function MPlayer (options) {
    this.options = options
    this.init()
  }

  MPlayer.prototype.init = function () {

    const options = this.options
    this.el = document.getElementById(options.el)
    const autoPlay = options.autoplay
    this.musicList = options.music

    this.el.innerHTML = audioHtml

    // DOM
    const el = this.el
    this.toggleEl = el.querySelector('.player-toggle')
    this.lrcEl = el.querySelector('.player-lrc')
    this.spectrumEl = el.querySelector('.player-spectrum')
    this.titleEl = el.querySelector('.player-title')
    this.authorEl = el.querySelector('.player-author')
    this.loadingEl = el.querySelector('.player-loading')
    // time bar
    this.timeBarEl = el.querySelector('.time-bar')
    this.totalTimeEl = el.querySelector('.total-time')
    this.playedTimeEl = el.querySelector('.played-time')
    this.playerCoverEl = el.querySelector('.player-cover')
    this.playerCoverImgEl = el.querySelector('.player-cover-img')
    this.persentPlayedEl = el.querySelector('.played-time-bar')
    // volume
    this.playerVolumeEl = el.querySelector('.player-volume-icon')
    this.volumeBarEl = el.querySelector('.player-volume-bar')
    this.totalVolumeEl = el.querySelector('.total-volume-bar')
    this.currentVolumeEl = el.querySelector('.current-volume-bar')
    // music list
    this.playerListEl = el.querySelector('.player-list')
    this.musicListEl = el.querySelector('.music-list')
    /**
     * 为何不使用 querySelectorAll? 因为 document.querySelectorAll 返回一个静态的 NodeList
     *
     * https://www.zhihu.com/question/31576889
     * https://developer.mozilla.org/zh-CN/docs/Web/API/NodeList
     * https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCollection
     */
    // this.musicItemEls = el.querySelectorAll('.music-item');
    this.musicItemEls = el.getElementsByClassName('music-item')

    if (!Array.isArray(this.musicList) || this.musicList.length === 0) {
      this.loadingEl.classList.add('error')
      this.loadingEl.innerHTML = '参数错误 T^T'
      return
    }

    this.currentMusic = this.musicList[0]

    // generate music list
    let html = ''
    for (let i = 0; i < this.musicList.length; i++) {
      html += `<li class="music-item">${this.musicList[i].title} <span class="music-author">${this.musicList[i].author}</span></li>`
    }
    this.musicListEl.innerHTML = html
    this.musicItemEls[0].className = 'music-item active'

    // set music
    this.audio = document.createElement('audio')
    this.setMusic(false)
    this.audio.crossOrigin = 'anonymous'

    // lrc or spectrum
    this.currentMusic.lrc ? this.parseLrc(this.currentMusic.lrc) : this.initSpectrum()

    // add event listener
    this._addEventListener()

    // auto play
    autoPlay && this.toggle()
  }

  /**
   * play or pause
   */
  MPlayer.prototype.toggle = function (forcePlay) {
    if (forcePlay || this.audio.paused) {
      this.audio.play()
      this.toggleEl.className = 'player-toggle icon-pause'
      this.currentVolumeEl.style.height = this.audio.volume * 100 + '%'
    } else {
      this.audio.pause()
      this.toggleEl.className = 'player-toggle icon-play2'
    }
  }

  /**
   * set music
   */
  MPlayer.prototype.setMusic = function (forcePlay) {
    this.loadingEl.innerHTML = 'loading...'
    // // lrc or spectrum
    // this.currentMusic.lrc ? this.parseLrc(this.currentMusic.lrc) : this.initSpectrum();
    // song
    this.audio.src = this.currentMusic.src
    // song cover
    this.playerCoverImgEl.src = this.currentMusic.cover
    // song title
    this.titleEl.innerHTML = this.currentMusic.title
    // song author
    this.authorEl.innerHTML = this.currentMusic.author
    forcePlay && this.toggle(forcePlay)
  }

  MPlayer.prototype._addEventListener = function () {

    // play or pause
    this.toggleEl.addEventListener('click', () => {
      this.toggle()
    })

    // total time
    this.audio.addEventListener('durationchange', () => {
      this.totalTimeEl.innerHTML = _secondToTime(this.audio.duration)
    })

    // can play
    this.audio.addEventListener('canplaythrough', () => {
      this.loadingEl.innerHTML = ''
      this.currentMusic.lrc ? this.parseLrc(this.currentMusic.lrc) : this.initSpectrum()
    })

    this.audio.addEventListener('playing', () => {
      this.loadingEl.innerHTML = ''
      this.playerCoverEl.style.animationPlayState = 'running'
    })

    this.audio.addEventListener('pause', () => {
      this.loadingEl.innerHTML = ''
      this.playerCoverEl.style.animationPlayState = 'paused'
    })

    // music end
    this.audio.addEventListener('ended', () => {
      this.toggleEl.className = 'player-toggle icon-play2'
    })

    // time update
    this.audio.addEventListener('timeupdate', () => {
      this.playedTimeEl.innerHTML = _secondToTime(this.audio.currentTime)
      this.persentPlayedEl.style.width = (this.audio.currentTime / this.audio.duration) * 100 + '%'
      this.lrcEl.innerHTML = getCurrentLrc(this.currentLrc, this.audio.currentTime)
    })

    // error listener
    this.audio.addEventListener('error', () => {
      this.loadingEl.classList.add('error')
      this.loadingEl.innerHTML = '加载失败 T^T'
      this.playerCoverEl.style.animationPlayState = 'paused'
    })

    // progress bar
    this.timeBarEl.addEventListener('click', (e) => {
      const event = e || window.event
      const timeBarWidth = this.timeBarEl.clientWidth
      const rect = this.timeBarEl.getBoundingClientRect()
      const viewLeft = rect.left
      const percentage = ((event.clientX - viewLeft ) / timeBarWidth).toFixed(2)

      this.persentPlayedEl.style.width = percentage * 100 + '%'
      this.audio.currentTime = percentage * this.audio.duration
      this.playedTimeEl.innerHTML = _secondToTime(this.audio.currentTime)
    })

    // volume
    this.playerVolumeEl.addEventListener('click', (e) => {
      if (this.audio.muted) {
        this.audio.muted = false
        this.playerVolumeEl.className = 'player-volume-icon icon-volume-medium'
        this.currentVolumeEl.style.height = '100%'
      } else {
        this.audio.muted = true
        this.playerVolumeEl.className = 'player-volume-icon icon-volume-mute2'
        this.currentVolumeEl.style.height = '0%'
      }
    })

    this.volumeBarEl.addEventListener('click', (e) => {
      const event = e || window.event
      const volumeBarHeight = this.volumeBarEl.clientHeight
      const rect = this.volumeBarEl.getBoundingClientRect()
      const viewTop = rect.top
      const percentage = 1 - ((event.clientY - viewTop ) / volumeBarHeight).toFixed(2)

      this.currentVolumeEl.style.height = percentage * 100 + '%'
      this.audio.volume = percentage
    })

    // show or hide music list
    this.playerCoverEl.addEventListener('click', () => {
      this.playerListEl.style.display = (this.playerListEl.style.display === 'block'
        ? 'none'
        : 'block')
    })

    // music list
    this.musicListEl.addEventListener('click', (e) => {
      for (let i = 0; i < this.musicItemEls.length; i++) {
        this.musicItemEls[i].classList.remove('active')
      }
      if (e.target && (e.target.nodeName === 'LI')) {
        const node = e.target
        const index = [].indexOf.call(node.parentNode.children, node)
        this.currentMusic = this.musicList[index]
        node.className = 'music-item active'

        this.setMusic(true)
      }
    })
  }

  MPlayer.prototype.parseLrc = function (lrc) {
    this.spectrumEl.style.display = 'none'
    this.lrcEl.style.display = ''

    if (!lrc) {
      this.currentLrc = [[0, '']]
    }
    // if lrc is url and need to download
    else if (lrc.indexOf('http') === 0) {
      if (window.fetch) {
        console.log('fetch...')
        fetch(lrc).then((response) => {
          return response.text()
        }).then((text) => {
          this.currentLrc = getParsedLrcArr(text)
        }).catch(function (err) {
          console.error(err)
        })
      } else {
        let request = new XMLHttpRequest()
        request.open('GET', lrc, true)

        request.onload = () => {
          if (request.status >= 200 && request.status < 400) {
            let text = request.responseText
            this.currentLrc = getParsedLrcArr(text)
          }
        }
        request.onerror = (err) => {
          console.log(err)
        }
        request.send()
      }
    }
    // if lrc is text
    else {
      this.currentLrc = getParsedLrcArr(lrc)
    }
  }

  // TODO
  /**
   * init spectrum
   */
  MPlayer.prototype.initSpectrum = function () {
    this.currentLrc = null
    this.spectrumEl.style.display = ''
    this.lrcEl.style.display = 'none'

    const canvas = this.spectrumEl
    // 创建一个MediaElementAudioSourceNode接口来关联HTMLMediaElement.
    // 这可以用来播放和处理来自<video>或<audio> 元素的音频.
    let source
    // use WeakMap to avoid
    // 'HTMLMediaElement already connected previously to a different MediaElementSourceNode.' issue.
    if (MEDIA_ELEMENT_NODES.has(this.audio)) {
      source = MEDIA_ELEMENT_NODES.get(this.audio)
    } else {
      source = audioCtx.createMediaElementSource(this.audio)
      MEDIA_ELEMENT_NODES.set(this.audio, source)
    }
    // source = audioCtx.createMediaElementSource(this.audio)
    // 创建一个AnalyserNode，它可以用来显示音频时间和频率的数据
    const analyser = audioCtx.createAnalyser()
    // 连接：source → analyser → destination
    source.connect(analyser)
    analyser.connect(audioCtx.destination)

    const canvasWidth = canvas.width, canvasHeight = canvas.height
    const canvasCtx = canvas.getContext('2d')
    // 存储数据，analyser.frequencyBinCount === 1024
    const arr = new Uint8Array(analyser.frequencyBinCount)
    const count = arr.length, // 能量柱个数
      lineWidth = canvasCtx.lineWidth = canvasWidth / count // 能量柱宽度
    let drawX = 0, // 能量柱X轴坐标
      drawY = 0; // 能量柱Y轴坐标

    (function render (e) {
      analyser.getByteFrequencyData(arr)

      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight)
      for (let i = 0; i < count; i++) {
        drawX = i * lineWidth
        drawY = parseInt(canvasHeight - arr[i] * 0.1)
        canvasCtx.beginPath()
        canvasCtx.strokeStyle = 'pink'
        canvasCtx.moveTo(drawX, canvasHeight)
        canvasCtx.lineTo(drawX, drawY)
        canvasCtx.stroke()
      }
      requestAnimationFrame(render)
    })()
  }

  /**
   * second to 00:00
   *
   * @param second
   * @return {string}
   */
  function _secondToTime (second) {
    let min = parseInt(second / 60)
    let sec = parseInt(second % 60)
    let add0min = min < 10 ? ('0' + min) : min
    let add0sec = sec < 10 ? ('0' + sec) : sec
    return `${add0min}:${add0sec}`
  }

  /**
   * parse lrc
   * @refer https://github.com/DIYgod/APlayer/blob/master/src/APlayer.js#L621-L644
   */
  function getParsedLrcArr (text) {
    let lyric = text.split('\n')
    if (lyric.length === 1) {
      lyric = text.split(' ')
    }
    let lrc = []
    for (let i = 0, lyricLen = lyric.length; i < lyricLen; i++) {
      // match lrc time
      const lrcTimes = lyric[i].match(/\[(\d{2}):(\d{2})\.(\d{2,3})]/g)
      // match lrc text
      const lrcText = lyric[i].replace(/\[(\d{2}):(\d{2})\.(\d{2,3})]/g, '').replace(/^\s+|\s+$/g, '')
      if (lrcTimes !== null) {
        // handle multiple time tag
        const timeLen = lrcTimes.length
        for (let j = 0; j < timeLen; j++) {
          const oneTime = /\[(\d{2}):(\d{2})\.(\d{2,3})]/.exec(lrcTimes[j])
          const lrcTime = (oneTime[1]) * 60 + parseInt(oneTime[2]) +
            parseInt(oneTime[3]) / ((oneTime[3] + '').length === 2 ? 100 : 1000)
          lrc.push([lrcTime, lrcText])
        }
      }
    }
    // sort by time
    lrc.sort((a, b) => a[0] - b[0])
    return lrc
  }

  function getCurrentLrc (lrc, time) {
    if (!lrc) return ''
    if (time < lrc[0][0]) return lrc[0][1]
    let i = 0
    for (let l = lrc.length; i < l; i++) {
      if (time >= lrc[i][0] && (!(lrc[i + 1]) || time <= lrc[i + 1][0])) {
        break
      }
    }
    return lrc[i][1]
  }

  window.MPlayer = MPlayer

}()