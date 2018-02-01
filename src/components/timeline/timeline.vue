<template>
  <div
    class="timeline"
    :class="{
      'timeline-light': theme === 'light',
      'timeline-collapse': collapse
    }"
    ref="timeline">
    <div
      class="tl-module tl-main"
      :class="hasCollapse">
      <div class="tl-control">
        <tl-tooltip :disabled="!showTooltip" placement="top" content="最早" :key="'tl-first'">
          <transition name="fade-in-linear">
            <div
              v-show="!collapse"
              class="tl-control-btn tl-first"
              :class="{ 'tl-control-btn-disable': !pause }"
              @click="onClickFirst">
              <i class="tl-icon-first"></i>
            </div>
          </transition>
        </tl-tooltip>
        <tl-tooltip :disabled="!showTooltip" placement="top" :key="'tl-play'">
          <span slot="content">{{ pause ? '播放' : '暂停' }}</span>
          <div
            class="tl-control-btn tl-play"
            :class="{ 'tl-control-btn-disable': !supportPlay }"
            @click="onClickPlay"><i :class="playIcon"></i></div>
        </tl-tooltip>
        <tl-tooltip :disabled="!showTooltip" placement="top" content="最晚" :key="'tl-last'">
          <transition name="fade-in-linear">
            <div
              v-show="!collapse"
              class="tl-control-btn tl-last"
              :class="{ 'tl-control-btn-disable': !pause }"
              @click="onClickLast">
              <i class="tl-icon-last"></i>
            </div>
          </transition>
        </tl-tooltip>
      </div>
      <div class="tl-datetime-container" ref="container" :style="datetimeContainerStyle">
        <div class="tl-datetime" ref="datetime">
          <ul class="tl-datetime-list" ref="list">
            <tl-tooltip
              :disabled="!showTooltip"
              v-for="(item, index) in time.timeList"
              :key="item"
              placement="top">
              <span slot="content">{{ index === current ? time.timeStrList[index].slice(-11) : (`${item === time.now ? '当前 ' : ''}${time.timeStrList[index].slice(-5)}`) }}</span>
              <li
                class="tl-datetime-item"
                :class="{
                  'tl-datetime-item-now': item === time.now,
                  'tl-datetime-item-current': index === current,
                  'tl-datetime-item-disable': !pause,
                }"
                :style="{ width: itemWidth + 'px' }"
                :data-datetime="time.timeStrList[index]"
                @click="onClickItem(index)">
                <!-- 显示的小时 -->
                <span
                  v-if="new Date(item).getHours() !== new Date(time.timeList[index - 1]).getHours()"
                  class="tl-datetime-hour"
                  :data-hour="new Date(item).getHours()"></span>
                <!-- tl-datetime-hour-last 这个 span 是为了补最后一个小时数字的显示 -->
                <span
                  v-if="index === time.timeList.length - 1"
                  class="tl-datetime-hour tl-datetime-hour-last"
                  :data-hour="new Date(item + 60 * 60 * 1000).getHours()"></span>
                <!-- 显示的日期 -->
                <span
                  v-if="new Date(item).getDate() !== new Date(time.timeList[index - 1]).getDate()"
                  class="tl-datetime-date"
                  :data-date="time.timeStrList[index].substring(5, 10)"></span>
              </li>
            </tl-tooltip>
          </ul>
          <tl-slider
            v-model="minIndex"
            :place="'first'"
            ref="buttonFirst">
          </tl-slider>
          <tl-slider
            v-model="maxIndex"
            :place="'last'"
            ref="buttonLast">
          </tl-slider>
        </div>
      </div>
    </div>
    <div class="tl-module tl-menu" @click="showMenuDetail = !showMenuDetail">
      <i class="tl-icon-setting"></i>
      <transition name="fade-in-linear">
        <div v-show="showMenuDetail" class="tl-menu-list">
          <div class="tl-menu-item">图层管理</div>
          <div v-if="datePicker" class="tl-menu-item">时间选择</div>
          <div v-if="speedSetting" class="tl-menu-item">倍速播放</div>
        </div>
      </transition>
    </div>
    <tl-tooltip :disabled="!showTooltip" v-if="showCollapse">
      <span slot="content">{{ collapse ? '展开' : '收起' }}</span>
      <div
        class="tl-module tl-collapse"
        :class="{ 'tl-collapse-disable': !pause }"
        @click="onClickCollapse">
        <i class="tl-icon-prev"></i>
      </div>
    </tl-tooltip>
  </div>
</template>

<script type="text/ecmascript-6">
  // TODO 多层 space；e.g: space = [6、12、30], now = 201701172224；最后剩36分钟但是 space = 30，相除等于1.2
  // TODO range 支持小数，e.g: [1.5, 13.5]
  // TODO 时间字符串的精度可配置
  import BScroll from 'better-scroll';
  import debounce from 'throttle-debounce/debounce';
  import { handle } from './utils/handle';
  import Velocity from 'velocity-animate';
  import TlSlider from './lib/slider/slider.vue';
  import TlTooltip from './lib/tooltip';
  import { SPEED_DURATION } from './utils/config';

  const MENU_BTN_WIDTH = 40;
  const COLLAPSE_BTN_WIDTH = 20;
  const CONTROL_BTN_WIDTH = 96;
  const HOUR_WIDTH = 72;
  const PADDING_WIDTH = 20;
  const COLLAPSE_WIDTH = 108;

  export default {
    name: 'Timeline',
    props: {
      // 是否支持播放
      supportPlay: {
        type: Boolean,
        default: true
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
      // 时间轴播放是否暂停
      pause: {
        type: Boolean,
        required: true,
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
      },
      // 时间轴是否循环播放
      loop: {
        type: Boolean,
        default: true
      },
      // 时间轴的播放区间是否可以改变
      freeze: {
        type: Boolean,
        default: false
      }
    },
    components: {
      TlSlider,
      TlTooltip
    },
    data () {
      return {
        time: {},
        collapse: false, // 时间轴是否正处于折叠状态
        timer: null, // 时间轴播放的定时器
        visibleWidth: 0, // 时间轴有刻度的区域的宽度
        timelineWidth: 0, // 整个时间轴容器的宽度
        current: -1, // 当前时间的索引值
        minIndex: null, // 播放区间最小值的索引
        maxIndex: null, // 播放区间最大值的索引
        scrollHandler: null, // scroll 实例的句柄
        showMenuDetail: false // 是否显示 menu 菜单详情
      };
    },
    computed: {
      // 播放按钮的状态，显示播放或者暂停
      playIcon () {
        return this.pause ? 'tl-icon-play' : 'tl-icon-pause';
      },
      // 是否显示收起 button
      hasCollapse () {
        return this.showCollapse ? 'tl-hasCollapse' : '';
      },
      // 时间轴上每一格的宽度
      itemWidth () {
        let itemsInHour = !isNaN(this.space) && this.space < 60 ? 60 / this.space : 1; // 当 this.space 不是数字或大于 60 的时候 itemsInHour = 1
        let width = '';
        if (HOUR_WIDTH / itemsInHour * this.time.timeList.length > this.visibleWidth) {
          width = HOUR_WIDTH / itemsInHour;
        } else {
          width = (this.visibleWidth - PADDING_WIDTH) / this.time.timeList.length;
        }
        return width;
      },
      // 时间轴刻度区域的宽度
      datetimeContainerStyle () {
        return {
          width: `${this.visibleWidth}px`
        };
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
          this.doPause();
        } else {
          this.doPlay();
        }
      },
      current (n) {
        this.$emit('current', this.time.timeList[n]);
      },
      minIndex (n, o) {
        if (n >= this.maxIndex) {
          this.minIndex = this.maxIndex - 1;
        } else if (n < this.time.firstPlaceholderIndex) {
          this.minIndex = this.time.firstPlaceholderIndex;
        }

        debounce(1000, () => {
          if (this.current < this.minIndex) {
            this.current = this.minIndex;
          }
          this.$emit('minimum', this.minIndex);
        })();
      },
      maxIndex (n, o) {
        if (n > this.time.lastPlaceholderIndex) {
          this.maxIndex = this.time.lastPlaceholderIndex;
        } else if (n <= this.minIndex) {
          this.maxIndex = this.minIndex + 1;
        }

        debounce(1000, () => {
          if (this.current > this.maxIndex) {
            this.current = this.maxIndex - 1;
          }
          this.$emit('maximum', this.maxIndex);
        })();
      },
      collapse (n, o) {
        // 时间轴收起时过渡动画
        let width = 0;
        if (n) {
          width = `${COLLAPSE_WIDTH}px`;
        } else {
          width = `${this.timelineWidth}px`;
        }
        Velocity(
          this.$refs.timeline,
          { width },
          { duration: SPEED_DURATION }
        );
      }
    },
    created () {
      if (!this.pause) {
        throw new Error('初始化时无法播放');
      }
      this.init();
    },
    mounted () {
      this.timelineWidth = this.$refs.timeline.offsetWidth;
      this.visibleWidth = this.timelineWidth - MENU_BTN_WIDTH - (this.showCollapse ? COLLAPSE_BTN_WIDTH : 0) - CONTROL_BTN_WIDTH;
      this.$nextTick(() => {
        this.initScroll();
        this.setNowLabelPosition();
      });
    },
    methods: {
      init () {
        this.time = handle(this.now, this.range, this.space);
        this.minIndex = this.time.firstPlaceholderIndex;
        this.maxIndex = this.time.lastPlaceholderIndex;
        this.$emit('time', this.time);
        console.log('this.time', this.time);
      },
      initScroll () {
        this.scrollHandler = new BScroll(this.$refs.container, { scrollX: true });
      },
      setNowLabelPosition () {
        let nowIndex = this.time.timeList.findIndex(a => {
          return a === this.time.now;
        });
        if (nowIndex > -1) {
          this.current = nowIndex;
        } else {
          this.current = this.time.timeList.length - 1;
        }
        this.scrollTo(this.current);
      },
      doPause () {
        console.log('暂停播放', this.pause);
        clearTimeout(this.timer);
        this.timer = null;
      },
      doPlay () {
        console.log('开始播放', this.pause);
        this.current++;
        if (this.current === this.maxIndex) {
          if (this.loop) {
            this.current = this.minIndex;
          } else {
            this.current = this.maxIndex - 1;
            this.onClickPlay();
          }
        }
        this.scrollTo(this.current);
        this.timer = setTimeout(() => {
          this.doPlay();
        }, SPEED_DURATION);
      },
      onClickCollapse () {
        if (!this.pause) { return; }
        this.collapse = !this.collapse;
      },
      onClickFirst () {
        if (!this.pause) { return; }
        this.current = this.minIndex;
        this.scrollTo(this.current);
      },
      onClickLast () {
        if (!this.pause) { return; }
        this.current = this.maxIndex - 1;
        this.scrollTo(this.current);
      },
      onClickPlay () {
        if (!this.supportPlay) { return; }
        this.$emit('update:pause', !this.pause);
      },
      onClickItem (index) {
        if (!this.pause) { return; }
        this.current = index;
      },
      scrollTo (index) {
        if (index < 0 || index >= this.time.timeList.length) { return; }
        // 计算可视区域内的最小 index 和最大 index
        let scrollXMatrix = document.defaultView.getComputedStyle(this.$refs.datetime, null).transform.replace(/[^0-9\-.,]/g, '').split(',');
        let scrollX = Math.abs(+(scrollXMatrix[12] || scrollXMatrix[4]));

        let visibleMinIndex = scrollX ? (scrollX - PADDING_WIDTH / 2) / this.itemWidth : 0;
        let visibleMaxIndex = (this.visibleWidth + scrollX - PADDING_WIDTH / 2) / this.itemWidth;

        let xOffset;
        let xMaxOffset;
        let xExpectedOffset = this.visibleWidth / 2 - (this.itemWidth * index + PADDING_WIDTH / 2);
        if (index > visibleMaxIndex) {
          xMaxOffset = this.visibleWidth - (this.$refs.list.clientWidth + PADDING_WIDTH);
          xOffset = xExpectedOffset < xMaxOffset ? xMaxOffset : xExpectedOffset;
        } else if (index < visibleMinIndex) {
          xMaxOffset = 0;
          xOffset = xExpectedOffset > xMaxOffset ? xMaxOffset : xExpectedOffset;
        } else {
          return;
        }

        this.scrollHandler.scrollTo(xOffset, 0, SPEED_DURATION);
      }
    },
    destroy () {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };
</script>

<style lang="stylus">
  // 全局的 tooltip 样式
  @import './css/tooltip';
</style>

<style lang="stylus" scoped>
  @import './css/timeline';
</style>
