<template>
  <div id="app">
    <button type="button" @click="range = [-12, 24]">range = [-12, 24]</button>
    <button type="button" @click="space = 20">space = 20</button>
    <button type="button" @click="now = new Date().getTime() + 86400000">一天以后</button>
    <button type="button" @click="handleResize">重新渲染宽度</button>
    <button type="button" @click="handlePause"> 播放 ：{{ !pause }} </button>
    <div class="current-time">{{ formatCurTime }}</div>
    <timeline
      ref="timeline"
      class="timeline-wrapper"
      :now="now"
      :range="range"
      :space="space"
      :pause.sync="pause"
      :theme="'dark'"
      datePicker
      :show-collapse="true"
      :show-tooltip="true"
      :freeze="false"
      @current="handleCurrentTime"
      @minimum="handleMinIndex"
      @maximum="handleMaxIndex"
      @time="handleTimeObj"></timeline>
  </div>
</template>

<script>
  import moment from 'moment';
  import timeline from './components/timeline/timeline';

  export default {
    name: 'app',
    components: {
      timeline
    },
    data () {
      return {
        // 15:44, 20, [-24, 0] 有 bug
        now: new Date().getTime(),
        range: [-24, 0],
        space: 20,
        pause: true,
        formatCurTime: 0
      };
    },
    methods: {
      handlePause () {
        this.pause = !this.pause;
      },
      handleCurrentTime (item) {
        this.formatCurTime = moment(item).format('YYYY-MM-DD HH:mm');
      },
      handleMinIndex (index) {
        console.log('App.vue: handleMinIndex', index);
      },
      handleMaxIndex (index) {
        console.log('App.vue: handleMaxIndex', index);
      },
      handleTimeObj (list) {
        console.log('App.vue: handleTimeObj', list);
      },
      // 想要让时间轴重新渲染宽度，需要显示的改变时间轴的宽度
      handleResize () {
        let width = this.$refs.timeline.$el.offsetWidth + 20;
        this.$refs.timeline.$el.style.width = `${width}px`;
        this.$refs.timeline.resize();
      }
    }
  };
</script>

<style lang="stylus">
  // @import './components/timeline/css/tooltip';
  #app
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

  .timeline-wrapper
    position: absolute;
    bottom: 0;
    left: 100px;
    right: 100px;
</style>
