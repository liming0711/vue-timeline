<template>
  <div id="app">
    <div class="timeline-wrapper">
      <timeline :now="now" :range="range" :space="space"></timeline>
    </div>
  </div>
</template>

<script>
import timeline from './components/timeline/timeline';

export default {
  name: 'app',
  components: {
    timeline
  },
  data () {
    return {
      now: new Date().getTime(),
      range: [0, 48],
      space: {
        60: [0, 12],
        180: [12, 24],
        360: [24, 48]
      }
    };
  }
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.timeline-wrapper {
  position: fixed;
  bottom: 0;
  left: 100px;
  right: 100px;
}
</style>
