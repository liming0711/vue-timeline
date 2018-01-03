import moment from 'moment';

const MINUTE_IN_HOUR = 60; // 1小时有60分钟标志位
const MILLISECONDS_IN_MINUTE = 60 * 1000; // 1分钟有60000毫秒标志位

const getNewNow = function (now, minSpace, mode) {
  let remainder = moment(now).format('mm') % minSpace;
  let newNow = 0;

  switch (mode) {
    case 'round':
      newNow = (remainder >= minSpace / 2) ? now + (minSpace - remainder) * MILLISECONDS_IN_MINUTE : now - remainder * MILLISECONDS_IN_MINUTE;
      break;
    case 'ceil':
      newNow = now + (minSpace - remainder) * MILLISECONDS_IN_MINUTE;
      break;
    case 'floor':
      newNow = now - remainder * MILLISECONDS_IN_MINUTE;
  }
  return newNow;
};
// 获取时间轴的有效持续时间
const getDuration = function (array) {
  return array ? Math.abs(array[1] - array[0]) : 0;
};

const paramValidate = function (range, space, spaceList) {
  let valid = true;
  if (range[0] >= range[1]) {
    valid = false;
    throw new Error('结束时间不能小于开始时间');
  }
  if (getDuration(range) < 2) {
    valid = false;
    throw new Error('持续时间不能少于2小时');
  }
  // space 的区间必须连贯，且多个 space 之和必需和 range 相等
  if (spaceList.length > 1) {
    for (let i = 1, len = spaceList.length; i < len; i++) {
      if (space[spaceList[i]][0] !== space[spaceList[i - 1]][1]) {
        valid = false;
        throw new Error('时间间隔的区间必须连贯');
      }
    }
    if ([space[spaceList[0]][0], space[spaceList[spaceList.length - 1]][1]].toString() !== range.toString()) {
      valid = false;
      throw new Error('时间间隔的区间之和必需和时间区间相等');
    }
  }
  return valid;
};

export const handleTime = (now, range, space, mode) => {
  if (!isNaN(space)) {
    let newSpace = {};
    newSpace[space] = range;
    space = newSpace;
  }
  let spaceList = Object.keys(space).sort((a, b) => { return a - b; });

  if (!paramValidate(range, space, spaceList)) {
    return false;
  }

  let minSpace = +spaceList[0];
  let maxSpace = +spaceList[spaceList.length - 1];
  let newNow = getNewNow(now, minSpace, mode);
  // 获取时间轴的有效开始时间（不含占位符）
  let start = newNow - Math.abs(range[0]) * MINUTE_IN_HOUR * MILLISECONDS_IN_MINUTE;

  let firstPlaceholderList = []; // 最开始占位时间数组
  let timeList = []; // 有效时间数组
  let lastPlaceholderList = []; // 最后占位时间数组
  let dateList = [];

  let timestamp = 0;
  let dateStr = '';

  const setDateList = function (timestamp) {
    dateStr = moment(timestamp).format('YYYY-MM-DD');
    if (!dateList.find(a => { return a.key === dateStr; })) {
      dateList.push({
        key: dateStr,
        length: 1
      });
    } else {
      dateList[dateList.length - 1].length++;
    }
  };

  for (let i = moment(start).format('mm') / minSpace; i > 0; i--) {
    timestamp = start - minSpace * MILLISECONDS_IN_MINUTE * i;
    firstPlaceholderList.push(moment(timestamp).format('YYYY-MM-DD HH:mm'));
    setDateList(timestamp);
  }
  for (let i = 0; i < spaceList.length; i++) {
    for (let j = 0, len = getDuration(space[spaceList[i]]) * MINUTE_IN_HOUR / spaceList[i]; j < len; j++) {
      timestamp = (start + getDuration(space[spaceList[i - 1]]) * MINUTE_IN_HOUR * MILLISECONDS_IN_MINUTE) + spaceList[i] * MILLISECONDS_IN_MINUTE * j;
      timeList.push(moment(timestamp).format('YYYY-MM-DD HH:mm'));
      setDateList(timestamp);
    }
  }
  for (let i = 0, len = (60 - moment(start).format('mm')) / maxSpace; i < len; i++) {
    timestamp = start + getDuration(range) * MINUTE_IN_HOUR * MILLISECONDS_IN_MINUTE + maxSpace * MILLISECONDS_IN_MINUTE * i;
    lastPlaceholderList.push(moment(timestamp).format('YYYY-MM-DD HH:mm'));
    setDateList(timestamp);
  }

  return {
    now: newNow,
    timeList: timeList,
    firstPlaceholderList: firstPlaceholderList,
    lastPlaceholderList: lastPlaceholderList,
    dateList: dateList
  };
};
