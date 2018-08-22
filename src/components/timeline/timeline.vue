<template>
  <div
    class="timeline"
    :class="{
      'timeline-light': theme === 'light',
      'timeline-collapse': collapse
    }"
    :style="timelineWidthStyle"
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
      <div class="tl-datetime-main" ref="datetime" :style="datetimeWidthStyle">
        <div class="tl-datetime" ref="datetime">
          <ul class="tl-datetime-list" ref="list">
            <tl-tooltip
              :disabled="!showTooltip"
              v-for="(item, index) in time.timeList"
              :key="item"
              placement="top">
              <span slot="content">{{ index === curIndex ? time.timeStrList[index].slice(-11) : (`${item === time.now ? '当前 ' : ''}${time.timeStrList[index].slice(-5)}`) }}</span>
              <li
                class="tl-datetime-item"
                :class="{
                  'tl-datetime-item-now': item === time.now,
                  'tl-datetime-item-current': index === curIndex,
                  'tl-datetime-item-disable': !pause,
                }"
                :style="{ width: itemWidth + 'px' }"
                :data-datetime="time.timeStrList[index]"
                @click="onClickItem(index)">
                <!-- 显示的小时 -->
                <span
                  v-if="new Date(item).getHours() !== new Date(time.timeList[index - 1]).getHours()"
                  class="tl-datetime-hour"
                  :data-timestamp="item"
                  :data-hour="new Date(item).getHours()"></span>
                <!-- tl-datetime-hour-last 这个 span 是为了补最后一个小时数字的显示 -->
                <span
                  v-if="index === time.timeList.length - 1"
                  class="tl-datetime-hour tl-datetime-hour-last"
                  :data-hour="new Date(item + space * 60 * 1000).getHours()"></span>
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
          <div class="tl-menu-item" @click="onClickLayerManager">图层管理</div>
          <div v-if="datePicker" class="tl-menu-item" @click="onClickDatetimePicker">时间选择</div>
          <div v-if="speedSetting" class="tl-menu-item" @click="onClickSpeedSetting">倍速播放</div>
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
  // TODO 移动端优化
  // TODO space 支持年/月/日/时
  import BScroll from 'better-scroll';
  import debounce from 'throttle-debounce/debounce';
  import { handle } from './utils/handle';
  import TlSlider from './lib/slider/slider.vue';
  import TlTooltip from './lib/tooltip';
  import { SPEED_DURATION, PADDING_WIDTH } from './utils/config';

  const MENU_BTN_WIDTH = 40;
  const COLLAPSE_BTN_WIDTH = 20;
  const CONTROL_BTN_WIDTH = 96;
  const HOUR_WIDTH = 72;
  const COLLAPSE_WIDTH = 108;
  const DEBOUNCE_TIME = 1000;

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
        time: {}, // 处理之后的时间数据对象
        collapse: false, // 时间轴是否正处于折叠状态
        timer: null, // 时间轴播放的定时器
        resizeTimer: null,
        visibleWidth: null, // 时间轴有刻度的区域的宽度
        timelineWidth: null, // 整个时间轴容器的宽度
        current: 0, // 当前时间的毫秒数
        curIndex: -2, // 当前时间的索引值
        minIndex: null, // 播放区间最小值的索引
        maxIndex: null, // 播放区间最大值的索引
        scrollX: 0, // 时间轴沿横轴方向滚动的距离的绝对值
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
      datetimeWidthStyle () {
        return {
          width: `${this.visibleWidth}px`
        };
      },
      timelineWidthStyle () {
        return {
          width: `${this.collapse ? COLLAPSE_WIDTH : this.timelineWidth}px`
        };
      },
      // 可视区间内的最小索引值
      visibleMinIndex () {
        let index = Math.floor((this.scrollX - PADDING_WIDTH / 2) / this.itemWidth);
        return index >= this.minIndex ? index : this.minIndex;
      },
      // 可视区间内的最大索引值
      visibleMaxIndex () {
        let index = Math.floor((this.visibleWidth + this.scrollX - PADDING_WIDTH / 2) / this.itemWidth);
        return index <= this.maxIndex ? index : this.maxIndex;
      }
    },
    watch: {
      now () {
        this.reinit();
      },
      range () {
        this.reinit();
      },
      space () {
        this.reinit();
      },
      pause (n) {
        if (n) {
          this.doPause();
        } else {
          this.doPlay();
        }
      },
      current (n) {
        this.$emit('current', this.current);
      },
      minIndex (n, o) {
        if (n >= this.maxIndex) {
          this.minIndex = this.maxIndex - 1;
        } else if (n < this.time.firstPlaceholderIndex) {
          this.minIndex = this.time.firstPlaceholderIndex;
        }

        debounce(DEBOUNCE_TIME, () => {
          if (this.curIndex < this.minIndex) {
            this.setCurIndex(this.minIndex);
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

        debounce(DEBOUNCE_TIME, () => {
          if (this.curIndex > this.maxIndex) {
            this.setCurIndex(this.maxIndex - 1);
          }
          this.$emit('maximum', this.maxIndex);
        })();
      }
    },
    created () {
      if (!this.pause) {
        throw new Error('初始化时无法播放');
      }
      this.init();
    },
    mounted () {
      this.calculateWidth();
      this.$nextTick(() => {
        this.initScroll();
        this.setCurIndex(this.curIndex);
      });
    },
    methods: {
      // 初始化时间轴
      init () {
        this.time = handle(this.now, this.range, this.space);
        this.minIndex = this.time.firstPlaceholderIndex;
        this.maxIndex = this.time.lastPlaceholderIndex;
        this.$emit('time', this.time);
      },
      // 初始化 better-scroll 并为x轴的滚动距离添加监听
      initScroll () {
        this.scrollHandler = new BScroll(this.$refs.datetime, {
          probeType: 3, // 当 probeType 为 3 的时候，不仅在屏幕滑动的过程中，而且在 momentum 滚动动画运行过程中实时派发 scroll 事件
          scrollX: true // 在时间轴初始化时指定滚动方向为横轴
        });
        this.scrollHandler.on('scroll', pos => {
          this.scrollX = Math.abs(pos.x);
        });
      },
      // 改变 now、space 或 range 时需要重新初始化时间轴
      reinit () {
        // 重新初始化时间轴时，如果时间轴正在播放则使其暂停
        if (!this.pause) {
          this.$emit('update:pause', true);
        }

        this.curIndex = -2;
        this.init();
        this.setCurIndex(this.curIndex);
      },
      // 重新计算时间轴的宽度并刷新 better-scroll
      resize () {
        // 因为宽度改变有动画，需要等到动画播放完成，否则 this.$refs.timeline.offsetWidth 无法获得准确值
        this.resizeTimer = setTimeout(() => {
          if (this.$refs.timeline.offsetWidth !== this.timelineWidth) {
            this.calculateWidth();
            this.$nextTick(() => {
              this.scrollHandler.refresh();
            });
          }
        }, SPEED_DURATION);
      },
      calculateWidth () {
        // 计算整个时间轴的宽度
        this.timelineWidth = this.$refs.timeline.offsetWidth;
        // 计算时间轴刻度区域可视部分的宽度
        this.visibleWidth = this.timelineWidth - MENU_BTN_WIDTH - (this.showCollapse ? COLLAPSE_BTN_WIDTH : 0) - CONTROL_BTN_WIDTH;
      },
      // 设置 index 的值，同时设置 current 的值为 index 在 time list 中对应的值
      // scroll 为布尔值，值为 true 时支持滚动，值为 false 时不支持滚动
      setCurIndex (index) {
        // 初始化的时候设置 index 的值为和 now 的索引相同
        // 当 range 是历史的时候 now 的索引可能会越界，当越界时使 index 为 time list 的最后一个索引
        if (index === -2) {
          index = this.time.timeList.findIndex(a => {
            return a === this.time.now;
          });
        }

        if (index > -1) {
          this.curIndex = index;
        } else {
          this.curIndex = this.time.timeList.length - 1;
        }
        this.current = this.time.timeList[this.curIndex];
        this.scrollTo(this.curIndex);
      },
      doPause () {
        clearTimeout(this.timer);
      },
      doPlay () {
        this.curIndex++;
        // 处理 curIndex 的边界值
        if (this.curIndex === this.maxIndex) {
          if (this.loop) {
            this.curIndex = this.minIndex;
          } else {
            this.curIndex = this.maxIndex - 1;
            this.$emit('update:pause', true);
          }
        }

        this.setCurIndex(this.curIndex);
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
        this.setCurIndex(this.minIndex);
      },
      onClickLast () {
        if (!this.pause) { return; }
        this.setCurIndex(this.maxIndex - 1);
      },
      onClickPlay () {
        if (!this.supportPlay) { return; }
        this.$emit('update:pause', !this.pause);
      },
      onClickItem (index) {
        if (!this.pause) { return; }
        this.setCurIndex(index);
      },
      scrollTo (index) {
        // index 值越界或者 dom 没有渲染完毕的时候，直接返回
        if (index < 0 || index >= this.time.timeList.length || !this.$refs.list) { return; }
        // index 值有效但是不符合条件时，直接返回
        if (index >= this.visibleMinIndex && index <= this.visibleMaxIndex) { return; }

        let offsetX; // 时间轴的实际移动距离
        let maxOffsetX; // 时间轴的最大可移动距离
        let expectedOffsetX = this.visibleWidth / 2 - (this.itemWidth * index + PADDING_WIDTH / 2); // 本次操作时间轴的期望移动距离
        if (index > this.visibleMaxIndex) {
          maxOffsetX = this.visibleWidth - (this.$refs.list.clientWidth + PADDING_WIDTH);
          offsetX = expectedOffsetX < maxOffsetX ? maxOffsetX : expectedOffsetX;
        } else if (index < this.visibleMinIndex) {
          maxOffsetX = 0;
          offsetX = expectedOffsetX > maxOffsetX ? maxOffsetX : expectedOffsetX;
        }

        this.scrollHandler.scrollTo(offsetX, 0, SPEED_DURATION);
      },
      onClickLayerManager () {
        this.$emit('layer-manager');
      },
      onClickSpeedSetting () {
        console.log('onClickSpeedSetting 倍速播放');
      },
      onClickDatetimePicker () {
        console.log('onClickDatetimePicker 时间选择');
      }
    },
    // 在 beforeDestroy 里，实例仍然完全可用，destroyed 里实例不可用
    // 故在 beforeDestroy 里销毁定时器
    beforeDestroy () {
      clearTimeout(this.timer);
      clearTimeout(this.resizeTimer);
    }
  };
</script>

<style lang="stylus">
  /* 全局的 tooltip 样式 */
  @import './css/tooltip';
</style>

<style lang="stylus" scoped>
  @import './css/timeline';
</style>
