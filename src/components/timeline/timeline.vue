<template>
  <div
    class="timeline"
    :class="{
      'timeline-light': theme === 'light',
      'timeline-collapse': collapse
    }"
    ref="timeline">
    <div class="tl-module tl-main">
      <div class="tl-control">
        <transition-group
          name="width-minus1"
          class="tl-control-inner"
          tag="div"
          :css="false"
          @before-enter="beforeEnterControl"
          @enter="enterControl"
          @leave="leaveControl">
          <div v-show="!collapse" class="tl-control-btn tl-first" :key="'tl-first'"><i class="tl-icon-first"></i></div>
          <div class="tl-control-btn tl-play" @click="onClickPlay" :key="'tl-play'"><i :class="playIcon"></i></div>
          <div v-show="!collapse" class="tl-control-btn tl-last" :key="'tl-last'"><i class="tl-icon-last"></i></div>
        </transition-group>
      </div>
      <div class="tl-datetime-container" ref="container">
        <div class="tl-datetime">
          <!-- <div
            class="tl-datetime-disable tl-datetime-disable_first"
            :style="{ width: disableFirstWidth + 'px' }">
          </div> -->
          <!-- <div
            class="tl-datetime-placeholder tl-datetime-placeholder_first"
            :style="{ left: (disableFirstWidth - 5) + 'px' }">
          </div> -->
          <transition
            name="width-minus2"
            :css="false"
            @before-enter="beforeEnterTime"
            @enter="enterTime"
            @leave="leaveTime">
            <ul v-show="!collapse" class="tl-datetime-list">
              <li
                v-for="(item, index) in time.timeList"
                :key="item"
                class="tl-datetime-item"
                :class="{
                  'tl-datetime-item-now': item === time.now,
                  'tl-datetime-item-current': index === current
                }"
                :style="{ width: itemWidth + 'px' }"
                :data-datetime="time.timeStrList[index]"
                @click="onClickItem(item, index)">
                <!-- 显示的小时 -->
                <span
                  v-if="new Date(item).getHours() !== new Date(time.timeList[index - 1]).getHours()"
                  class="tl-datetime-hour"
                  :data-hour="new Date(item).getHours()"></span>
                <!-- tl-datetime-hour-last 这个 span 是为了补最后一个小时数字的显示 -->
                <span
                  v-if="index === time.timeList.length - 1"
                  class="tl-datetime-hour tl-datetime-hour-last"
                  :data-hour="new Date(item).getHours() + 1"></span>
                <!-- 显示的日期 -->
                <span
                  v-if="new Date(item).getDate() !== new Date(time.timeList[index - 1]).getDate()"
                  class="tl-datetime-date"
                  :data-date="time.timeStrList[index].substring(5, 10)"></span>
              </li>
            </ul>
          </transition>
          <timeline-button
            v-model="firstValue"
            :place="'first'"
            ref="buttonFirst">
          </timeline-button>
          <timeline-button
            v-model="lastValue"
            :place="'last'"
            ref="buttonLast">
          </timeline-button>
          <!-- <div
            class="tl-datetime-placeholder tl-datetime-placeholder_last"
            :style="{ right: (disableLastWidth - 5) + 'px' }">
          </div> -->
          <!-- <div
            class="tl-datetime-disable tl-datetime-disable_last"
            :style="{ width: disableLastWidth + 'px' }">
          </div> -->
        </div>
      </div>
    </div>
    <div class="tl-module tl-menu"><i class="tl-icon-setting"></i></div>
    <div class="tl-module tl-collapse" @click="onClickCollapse"><i class="tl-icon-prev"></i></div>
  </div>
</template>

<script type="text/ecmascript-6">
  // NOTE 必须为 timeline 提供一个宽度，无论是显式的还是隐式的
  // TODO 多层 space；e.g: space = [6、12、30], now = 201701172224；最后剩36分钟但是 space = 30，相除等于1.2
  // TODO range 支持小数，e.g: [1.5, 13.5]
  import { handle } from './utils/handle';
  import { throttle } from './utils/throttle';
  import transition from './mixins/transition';
  import TimelineButton from './button.vue';
  import BScroll from 'better-scroll';

  const MENU_BTN_WIDTH = 40;
  const COLLAPSE_BTN_WIDTH = 20;
  const CONTROL_BTN_WIDTH = 96;
  const HOUR_WIDTH = 72;
  const PLAY_SPEED = 400;
  const OFFSET_WIDTH = '50%';

  export default {
    name: 'Timeline',
    mixins: [transition],
    props: {
      // 是否支持播放
      supportPlay: {
        type: Boolean,
        default: true
      },
      // 是否支持翻页
      supportPage: {
        type: Boolean,
        default: false
      },
      // 是否支持时间选择
      datePicker: {
        type: Boolean,
        default: false
      },
      // 是否支持倍速播放
      speedSetting: {
        type: Boolean,
        default: false
      },
      // 时间轴时间对齐方式
      mode: {
        type: String,
        default: 'round'
      },
      // 时间轴播放是否暂停
      pause: {
        type: Boolean,
        default: true
      },
      // 当前时间，毫秒数的时间戳
      now: {
        type: Number,
        required: true
      },
      // 时间区间，单位小时
      range: {
        type: Array,
        required: true
      },
      // 时间间隔，单位分钟
      space: {
        type: [Number, Object],
        required: true
      },
      theme: {
        type: String,
        default: 'dark'
      },
      showTooltip: {
        type: Boolean,
        default: true
      },
      showCollapse: {
        type: Boolean,
        default: true
      }
    },
    components: {
      TimelineButton
    },
    data () {
      return {
        time: {},
        collapse: false, // 时间轴是否正处于折叠状态
        suspend: true, // 时间轴是否正处于暂停状态
        timer: null, // 时间轴播放的定时器
        datetimeWidth: 0, // 时间轴有刻度的区域的宽度
        current: 0,
        firstValue: null,
        lastValue: null,
        scrollHandler: null
      };
    },
    computed: {
      playIcon () {
        return this.suspend ? 'tl-icon-play' : 'tl-icon-pause';
      },
      itemWidth () {
        let itemsInHour = isNaN(this.space) ? 1 : 60 / this.space;
        let width = '';
        if (HOUR_WIDTH / itemsInHour * this.time.timeList.length > this.datetimeWidth) {
          width = HOUR_WIDTH / itemsInHour;
        } else {
          width = this.datetimeWidth / this.time.timeList.length;
        }
        return width;
      },
      disableFirstWidth () {
        // 时间轴刻度区域左侧有 10px 的 padding 值，计算的时候需要加上
        if (this.time.firstPlaceholderIndex !== 0) {
          return this.time.firstPlaceholderIndex * this.itemWidth + 10;
        }
      },
      disableLastWidth () {
        // 时间轴刻度区域右侧有 10px 的 padding 值，计算的时候需要加上
        if (this.time.lastPlaceholderIndex !== this.time.timeList.length) {
          return (this.time.timeList.length - this.time.lastPlaceholderIndex) * this.itemWidth + 10;
        }
      }
    },
    watch: {
      now () {
        this.init();
      },
      range () {
        this.init();
      },
      space () {
        this.init();
      },
      pause (n) {
        if (n) {
          this.doSuspend();
        } else {
          this.doPlay();
        }
      },
      current (n, o) {
        console.log(n, o);
      }
    },
    created () {
      console.log('created', throttle, HOUR_WIDTH, PLAY_SPEED, OFFSET_WIDTH);
      if (!this.pause) {
        throw new Error('初始化时无法播放');
      }
      this.init();
    },
    mounted () {
      this.datetimeWidth = this.$refs.timeline.offsetWidth - MENU_BTN_WIDTH - COLLAPSE_BTN_WIDTH - CONTROL_BTN_WIDTH - 20;
      this.$nextTick(() => {
        this.initScroll();
      });
    },
    methods: {
      init () {
        this.time = handle(this.now, this.range, this.space, this.mode);
        this.current = this.time.firstPlaceholderIndex;
        this.firstValue = this.time.firstPlaceholderIndex;
        this.lastValue = this.time.lastPlaceholderIndex;
        console.log('this.time', this.time);
      },
      initScroll () {
        this.scrollHandler = new BScroll(this.$refs.container, { scrollX: true });
      },
      doSuspend () {
        console.log('暂停播放');
      },
      doPlay () {
        console.log('开始播放');
      },
      onClickCollapse () {
        this.collapse = !this.collapse;
      },
      onClickPlay () {
        this.suspend = !this.suspend;
        this.$emit('update:pause', this.suspend);
      },
      onClickItem (item, index) {
        this.current = index;
      }
    },
    destroy () {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };
</script>

<style lang="stylus" scoped>
  @import './css/reset';
  @import './css/icon';
  @import './css/theme';
  
  $height-all = 60px
  $collapse-speed = .4s

  .timeline
    height: $height-all
    color: $color-font
    background-color: $color-background
    overflow: hidden
    &.timeline-light
      background-color: $color-background-l
    &.timeline-collapse
      .tl-icon-prev
        transform: rotate(180deg)
    .tl-module
      float: left
      height: 100%
      line-height: $height-all
      cursor: pointer
    .tl-menu
      width: 40px
      margin-left: -100%
      font-size: 24px
      text-align: center
      background-color: $color-background-menu
    .tl-main
      width: 100%
      padding: 0 20px 0 40px;
      white-space: nowrap
      box-sizing: border-box
      .tl-control
        height: $height-all
        float: left
        .tl-control-btn
          float: left
          width: 32px
          text-align: center
          line-height: $height-all
      .tl-datetime-container
        width: 578px
        overflow: hidden
        .tl-datetime
          position: relative
          padding: 0 10px 37px 10px
          white-space: nowrap
          // .tl-datetime-disable
          //   position: absolute
          //   top: 0
          //   height: 100%
          //   background-color $color-disable
          //   z-index: 3
          //   cursor: not-allowed
          // .tl-datetime-disable_first
          //   left: 0
          // .tl-datetime-disable_last
          //   right: 0
          // .tl-datetime-placeholder
          //   position: absolute
          //   width: 11px
          //   height: 100%
          //   background: url(./images/indicator.png) no-repeat center center
          //   background-size: 11px 60px
          //   z-index: 4
          // .tl-datetime-placeholder_first
          //   top: 0
          // .tl-datetime-placeholder_last
          //   top: 0
          .tl-datetime-list
            font-size: 0
            .tl-datetime-item
              position: relative
              display: inline-block
              height: 22px
              color: $color-font
              border-bottom: 1px solid $color-tick
              cursor: pointer
              &:hover
                background-color: $color-current
              &:before
                content: ''
                position: absolute
                left: 0
                height: 4px
                bottom: 0
                width: 1px
                background-color: $color-tick
              .tl-datetime-hour
                position: absolute
                bottom: 0
                left: 0
                width: 1px
                height: 8px
                font-size: 14px
                background-color: $color-tick
                cursor: pointer
                &:after
                  content: attr(data-hour)
                  position: absolute
                  top: 12px
                  left: 0
                  width: 20px
                  margin-left: -10px
                  text-align: center
              .tl-datetime-hour-last
                left: auto
                right: 0
              .tl-datetime-date
                position: absolute
                top: 44px
                left: 0
                color: $color-date
                font-size: 12px
                &:after
                  content: attr(data-date)
                  display: inline-block
                  width: 10px
                  margin-left: -5px
                  text-align: center
            .tl-datetime-item-current
              background-color: $color-current
            .tl-datetime-item-now:after
                content: ''
                position: absolute;
                left: 1px
                bottom: 0;
                width: 100%
                height: 4px
                background-color: $color-now
    .tl-collapse
      width: 20px
      margin-left: -20px
      font-size: 12px
      text-align: center
      background-color: $color-background-menu
      .tl-icon-prev
        transition: transform $collapse-speed
</style>
