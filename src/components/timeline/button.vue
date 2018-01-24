<template>
  <div
    class="tl-button-wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousedown="onButtonDown"
    @focus="handleMouseEnter"
    @blur="handleMouseLeave"
    :class="{ 'hover': hovering, 'dragging': dragging }"
    :style="wrapperStyle"
    ref="button">
    <tl-tooltip placement="top" ref="tooltip" :disabled="!showTooltip">
      <span slot="content">{{ formatValue }}</span>
      <img class="tl-button" src="./images/indicator.png" :class="{ 'hover': hovering, 'dragging': dragging }" />
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
      vertical: {
        type: Boolean,
        default: false
      }
    },

    data () {
      return {
        hovering: false,
        dragging: false,
        isClick: false,
        startX: 0,
        currentX: 0,
        startY: 0,
        currentY: 0,
        startPosition: 0,
        newPosition: null,
        oldValue: this.value
      };
    },

    computed: {
      disabled () {
        return this.$parent.disabled;
      },

      max () {
        return this.$parent.time.timeList.length + 1;
      },

      min () {
        return -1;
      },

      step () {
        return this.$parent.step;
      },

      showTooltip () {
        return this.$parent.showTooltip;
      },

      precision () {
        return this.$parent.precision;
      },

      currentPosition () {
        return `${this.$parent.itemWidth * this.value + 10}px`;
      },

      enableFormat () {
        return this.$parent.formatTooltip instanceof Function;
      },

      formatValue () {
        return (this.enableFormat && this.$parent.formatTooltip(this.value)) || this.value;
      },

      wrapperStyle () {
        return this.vertical ? { bottom: this.currentPosition } : { left: this.currentPosition };
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
        this.dragging = true;
        this.isClick = true;
        if (this.vertical) {
          this.startY = event.clientY;
        } else {
          this.startX = event.clientX;
        }
        this.startPosition = parseFloat(this.currentPosition);
        this.newPosition = this.startPosition;
      },

      onDragging (event) {
        if (this.dragging) {
          this.isClick = false;
          this.displayTooltip();
          this.$parent.resetSize();
          let diff = 0;
          if (this.vertical) {
            this.currentY = event.clientY;
            diff = (this.startY - this.currentY) / this.$parent.sliderSize * 100;
          } else {
            this.currentX = event.clientX;
            diff = (this.currentX - this.startX) / this.$parent.sliderSize * 100;
          }
          this.newPosition = this.startPosition + diff;
          this.setPosition(this.newPosition);
        }
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
              this.$parent.emitChange();
            }
          }, 0);
          window.removeEventListener('mousemove', this.onDragging);
          window.removeEventListener('mouseup', this.onDragEnd);
          window.removeEventListener('contextmenu', this.onDragEnd);
        }
      },

      setPosition (newPosition) {
        if (newPosition === null) return;
        if (newPosition < 0) {
          newPosition = 0;
        } else if (newPosition > 100) {
          newPosition = 100;
        }
        const lengthPerStep = 100 / ((this.max - this.min) / this.step);
        const steps = Math.round(newPosition / lengthPerStep);
        let value = steps * lengthPerStep * (this.max - this.min) * 0.01 + this.min;
        value = parseFloat(value.toFixed(this.precision));
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
  // TODO 播放的时候不允许拖动，wrapper 和 button 都需要更改样式
  // .tl-runway.disabled .tl-button-wrapper.dragging,
  // .tl-runway.disabled .tl-button-wrapper.hover,
  // .tl-runway.disabled .tl-button-wrapper:hover {
	//   cursor: not-allowed
  .tl-button-wrapper
    position: absolute;
    top: 0;
    width: 10px;
    height: 100%;
    text-align: center;
    transform: translateX(-50%);
    background-color: transparent;
    z-index: 1001;
    user-select: none
    &:after
      content: '';
      display: inline-block;
      height: 100%;
      vertical-align: middle
    &:hover,
    &.hover
      cursor: -webkit-grab;
	    cursor: grab
    &.dragging
      cursor: -webkit-grabbing;
	    cursor: grabbing
    .el-tooltip
      vertical-align: middle;
	    display: inline-block
    // transform: scale(1);
	  // cursor: not-allowed
    // background-color: #bfcbd9
    .tl-button
      width: 10px;
      height: 60px;
      transition: .2s;
      user-select: none
    .tl-button.dragging,
    .tl-button.hover,
    .tl-button:hover
      -ms-transform: scale(1);
      transform: scale(1);
      background-color: #1c8de0
    .tl-button.hover,
    .tl-button:hover
      cursor: -webkit-grab;
      cursor: grab
    .tl-button.dragging
      cursor: -webkit-grabbing;
      cursor: grabbing
</style>
