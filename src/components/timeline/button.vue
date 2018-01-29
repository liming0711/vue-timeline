<template>
  <div
    class="tl-button-wrapper"
    :class="[{ 'hover': hovering, 'dragging': dragging }, buttonPlace]"
    :style="wrapperStyle"
    ref="button">
    <tl-tooltip placement="top" ref="tooltip" :disabled="!showTooltip">
      <span slot="content">{{ formatValue }}</span>
      <img
        class="tl-button"
        :class="{ 'hover': hovering, 'dragging': dragging }"
        src="./images/indicator.png"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousedown="onButtonDown"
        @focus="handleMouseEnter"
        @blur="handleMouseLeave" />
    </tl-tooltip>
  </div>
</template>

<script>
  import TlTooltip from './tooltip';
  export default {
    name: 'TimelineButton',

    components: {
      TlTooltip
    },

    props: {
      value: {
        type: Number,
        default: 0
      },
      place: {
        type: String,
        default: 'first'
      }
    },

    data () {
      return {
        hovering: false,
        dragging: false,
        isClick: false,
        startX: 0,
        currentX: 0,
        startPosition: 0,
        newPosition: null,
        oldValue: this.value
      };
    },

    computed: {
      disabled () {
        return this.$parent.disabled;
      },

      min () {
        return this.$parent.time.firstPlaceholderIndex;
      },

      max () {
        return this.$parent.time.lastPlaceholderIndex;
      },

      showTooltip () {
        return this.$parent.showTooltip;
      },

      currentPosition () {
        return this.$parent.itemWidth * this.value + 10;
      },

      enableFormat () {
        return this.$parent.formatTooltip instanceof Function;
      },

      formatValue () {
        let index = (this.enableFormat && this.$parent.formatTooltip(this.value)) || this.value;
        return this.$parent.time.timeStrList[+index];
      },

      wrapperStyle () {
        if (this.place === 'first') {
          return { width: `${this.currentPosition}px` };
        } else {
          return { width: `${(this.$parent.time.timeList.length - this.value) * this.$parent.itemWidth + 10}px` };
        }
      },
      buttonPlace () {
        return `tl-button-${this.place}`;
      }
    },

    watch: {
      dragging (val) {
        this.$parent.dragging = val;
      }
    },

    methods: {
      displayTooltip () {
        this.$refs.tooltip && (this.$refs.tooltip.showPopper = true);
      },

      hideTooltip () {
        this.$refs.tooltip && (this.$refs.tooltip.showPopper = false);
      },

      handleMouseEnter () {
        this.hovering = true;
        this.displayTooltip();
      },

      handleMouseLeave () {
        this.hovering = false;
        this.hideTooltip();
      },

      onButtonDown (event) {
        if (this.disabled) return;
        event.preventDefault();
        this.onDragStart(event);
        window.addEventListener('mousemove', this.onDragging);
        window.addEventListener('mouseup', this.onDragEnd);
        window.addEventListener('contextmenu', this.onDragEnd);
      },
      onDragStart (event) {
        console.log('onDragStart');
        this.dragging = true;
        this.isClick = true;
        this.startX = event.clientX;
        this.startPosition = this.currentPosition;
        this.newPosition = this.startPosition;
        this.$parent.scrollHandler.disable();
      },

      onDragEnd () {
        if (this.dragging) {
          /*
           * 防止在 mouseup 后立即触发 click，导致滑块有几率产生一小段位移
           * 不使用 preventDefault 是因为 mouseup 和 click 没有注册在同一个 DOM 上
           */
          setTimeout(() => {
            this.dragging = false;
            this.hideTooltip();
            if (!this.isClick) {
              this.setPosition(this.newPosition);
            }
          }, 0);
          window.removeEventListener('mousemove', this.onDragging);
          window.removeEventListener('mouseup', this.onDragEnd);
          window.removeEventListener('contextmenu', this.onDragEnd);
          this.$parent.scrollHandler.enable();
        }
      },

      onDragging (event) {
        if (this.dragging) {
          this.isClick = false;
          this.displayTooltip();
          let diff = 0;
          this.currentX = event.clientX;
          diff = this.currentX - this.startX;
          this.newPosition = this.startPosition + diff;
          this.setPosition(this.newPosition);
        }
      },

      setPosition (newPosition) {
        if (newPosition === null) return;

        let value = Math.round(newPosition / this.$parent.itemWidth);
        if (value > this.max) {
          value = this.max;
        } else if (value < this.min) {
          value = this.min;
        }
        this.$emit('input', value);
        this.$nextTick(() => {
          this.$refs.tooltip && this.$refs.tooltip.updatePopper();
        });
        if (!this.dragging && this.value !== this.oldValue) {
          this.oldValue = this.value;
        }
      }
    }
  };
</script>
<style lang="stylus" scoped>
  @import './css/theme';
  
  // TODO 播放的时候不允许拖动，wrapper 和 button 都需要更改样式
  // .tl-runway.disabled .tl-button-wrapper.dragging,
  // .tl-runway.disabled .tl-button-wrapper.hover,
  // .tl-runway.disabled .tl-button-wrapper:hover {
	//   cursor: not-allowed
  .tl-button-wrapper
    position: absolute
    top: 0
    height: 100%
    background-color: transparent
    z-index: 1001
    background-color: $color-disable
    cursor: not-allowed
    user-select: none
    &.tl-button-first
      left: 0
      text-align: right
      .tl-button
        transform: translateX(50%)
    &.tl-button-last
      right: 0
      text-align: left
      .tl-button
        transform: translateX(-50%)
    &:after
      content: ''
      display: inline-block
      height: 100%
      vertical-align: middle
    .el-tooltip
      vertical-align: middle
	    display: inline-block
    // transform: scale(1)
	  // cursor: not-allowed
    // background-color: #bfcbd9
    .tl-button
      width: 10px
      height: 60px
      cursor: pointer
      // transition: .2s
      user-select: none
    .tl-button.hover,
    .tl-button:hover
      cursor: grab
    .tl-button.dragging
      cursor: grabbing
</style>
