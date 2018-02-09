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
        :class="{ 'hover': hovering, 'dragging': dragging, 'disabled': !pause || freeze }"
        src="../../images/indicator.png"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousedown="onButtonDown"
        @focus="handleMouseEnter"
        @blur="handleMouseLeave" />
    </tl-tooltip>
  </div>
</template>

<script>
  import TlTooltip from '../tooltip';
  import { PADDING_WIDTH } from '../../utils/config';

  export default {
    name: 'TlSlider',

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
      pause () {
        return this.$parent.pause;
      },

      showTooltip () {
        return this.$parent.showTooltip;
      },

      freeze () {
        return this.$parent.freeze;
      },

      currentPosition () {
        return this.$parent.itemWidth * this.value + PADDING_WIDTH / 2;
      },

      formatValue () {
        return this.$parent.time.timeStrList[+this.value];
      },

      wrapperStyle () {
        if (this.place === 'first') {
          return { width: `${this.currentPosition}px` };
        } else {
          return { width: `${(this.$parent.time.timeList.length - this.value) * this.$parent.itemWidth + PADDING_WIDTH / 2}px` };
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
        if (!this.pause || this.freeze) { return; }
        event.preventDefault();
        this.onDragStart(event);
        window.addEventListener('mousemove', this.onDragging);
        window.addEventListener('mouseup', this.onDragEnd);
        window.addEventListener('contextmenu', this.onDragEnd);
      },
      onDragStart (event) {
        this.dragging = true;
        this.isClick = true;
        this.startX = event.clientX;
        this.startPosition = this.currentPosition;
        this.newPosition = this.startPosition;
        this.$parent.scrollHandler.disable();
      },

      onDragEnd () {
        if (this.dragging) {
          // 防止在 mouseup 后立即触发 click，导致滑块有几率产生一小段位移
          // 不使用 preventDefault 是因为 mouseup 和 click 没有注册在同一个 DOM 上
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
  @import '../../css/slider';
</style>
