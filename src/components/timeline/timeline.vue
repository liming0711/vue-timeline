<template>
  <div class="timeline">timeline</div>
</template>

<script type="text/ecmascript-6">
  import { handleTime } from './handleTime';
  import { throttle } from './throttle';
  import Velocity from 'velocity-animate';

  const PLAY_BTN_WIDTH = 40;
  const HOUR_DEFAULT_WIDTH = 60;
  const PLAY_SPEED = 500;
  const ANIMATION_SPEED = 400;
  const OFFSET_WIDTH = '50%';

  export default {
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
      // 时间轴播放是否暂停
      pause: {
        type: Boolean,
        default: false
      },
      mode: {
        type: String,
        default: 'round'
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
      }
    },
    data () {
      return {
        time: {}
      };
    },
    computed: {},
    watch: {},
    created () {
      console.log('created', throttle, Velocity, PLAY_BTN_WIDTH, HOUR_DEFAULT_WIDTH, PLAY_SPEED, ANIMATION_SPEED, OFFSET_WIDTH);
      this.init();
    },
    mounted () {},
    methods: {
      init () {
        this.time = handleTime(this.now, this.range, this.space, this.mode);
        console.log('this.time', this.time);
      }
    }
  };
</script>

<style scoped>
  @import url(timelineFont.css);

  .timeline {
    background-color: #ccc;
  }
</style>
