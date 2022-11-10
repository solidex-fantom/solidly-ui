import React, { useState, useEffect } from 'react';
import { useRouter } from "next/router";

import { Typography, Switch, Button, SvgIcon, Badge, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Grid } from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import HelpIcon from '@material-ui/icons/Help';
import ListIcon from '@material-ui/icons/List';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import DashboardOutlinedIcon from '@material-ui/icons/DashboardOutlined';

import Navigation from '../navigation'
import Unlock from '../unlock';
import TransactionQueue from '../transactionQueue';

import { ACTIONS } from '../../stores/constants';
import { styled, makeStyles } from '@material-ui/core/styles';
import stores from '../../stores';
import { formatAddress } from '../../utils';

import { walletlink } from '../../stores/connectors/connectors'

import classes from './header.module.css';

function SiteLogo(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0 0 1200 449.999984" className={className} width="1600" zoomAndPan="magnify" height="600" preserveAspectRatio="xMidYMid meet" version="1.0">
      <defs><g/><clipPath id="id1"><path d="M 42.210938 16.277344 L 174.6875 16.277344 L 174.6875 51.214844 L 42.210938 51.214844 Z M 42.210938 16.277344 " clip-rule="nonzero"/></clipPath><clipPath id="id2"><path d="M 22.5 74.6875 L 194.289062 74.6875 L 194.289062 109.625 L 22.5 109.625 Z M 22.5 74.6875 " clip-rule="nonzero"/></clipPath><clipPath id="id3"><path d="M 42.210938 133.097656 L 174.6875 133.097656 L 174.6875 168.035156 L 42.210938 168.035156 Z M 42.210938 133.097656 " clip-rule="nonzero"/></clipPath></defs><g fill="#ffffff" fill-opacity="1"><g transform="translate(239.571041, 167.004935)"><g><path d="M 48.484375 -23.96875 C 49.460938 -23.664062 50.4375 -23.46875 51.40625 -23.375 C 52.382812 -23.28125 53.363281 -23.234375 54.34375 -23.234375 C 56.78125 -23.234375 59.125 -23.566406 61.375 -24.234375 C 63.632812 -24.910156 65.753906 -25.875 67.734375 -27.125 C 69.722656 -28.375 71.492188 -29.894531 73.046875 -31.6875 C 74.609375 -33.488281 75.875 -35.488281 76.84375 -37.6875 L 95.140625 -19.296875 C 92.828125 -16.003906 90.160156 -13.046875 87.140625 -10.421875 C 84.117188 -7.804688 80.851562 -5.582031 77.34375 -3.75 C 73.84375 -1.914062 70.15625 -0.53125 66.28125 0.40625 C 62.40625 1.351562 58.425781 1.828125 54.34375 1.828125 C 47.445312 1.828125 40.960938 0.546875 34.890625 -2.015625 C 28.828125 -4.578125 23.523438 -8.144531 18.984375 -12.71875 C 14.441406 -17.289062 10.859375 -22.734375 8.234375 -29.046875 C 5.609375 -35.359375 4.296875 -42.296875 4.296875 -49.859375 C 4.296875 -57.609375 5.609375 -64.679688 8.234375 -71.078125 C 10.859375 -77.484375 14.441406 -82.941406 18.984375 -87.453125 C 23.523438 -91.972656 28.828125 -95.484375 34.890625 -97.984375 C 40.960938 -100.484375 47.445312 -101.734375 54.34375 -101.734375 C 58.425781 -101.734375 62.421875 -101.242188 66.328125 -100.265625 C 70.234375 -99.285156 73.9375 -97.878906 77.4375 -96.046875 C 80.945312 -94.222656 84.222656 -91.984375 87.265625 -89.328125 C 90.316406 -86.679688 93.003906 -83.710938 95.328125 -80.421875 Z M 61.296875 -75.46875 C 60.140625 -75.894531 58.992188 -76.171875 57.859375 -76.296875 C 56.734375 -76.421875 55.5625 -76.484375 54.34375 -76.484375 C 50.925781 -76.484375 47.707031 -75.859375 44.6875 -74.609375 C 41.664062 -73.359375 39.039062 -71.570312 36.8125 -69.25 C 34.59375 -66.9375 32.84375 -64.144531 31.5625 -60.875 C 30.28125 -57.613281 29.640625 -53.941406 29.640625 -49.859375 C 29.640625 -48.941406 29.6875 -47.90625 29.78125 -46.75 C 29.875 -45.59375 30.023438 -44.414062 30.234375 -43.21875 C 30.453125 -42.03125 30.710938 -40.890625 31.015625 -39.796875 C 31.316406 -38.703125 31.710938 -37.726562 32.203125 -36.875 Z M 53.34375 -109.03125 L 43 -122.671875 L 70.171875 -148 L 85.171875 -128.890625 Z M 53.34375 -109.03125 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(360.587752, 167.004935)"><g><path d="M 104.390625 37.328125 L 79.21875 37.328125 L 79.21875 -6.59375 C 77.332031 -5.488281 75.394531 -4.414062 73.40625 -3.375 C 71.425781 -2.34375 69.382812 -1.414062 67.28125 -0.59375 C 65.175781 0.226562 63.039062 0.882812 60.875 1.375 C 58.71875 1.863281 56.539062 2.109375 54.34375 2.109375 C 47.445312 2.109375 40.960938 0.84375 34.890625 -1.6875 C 28.828125 -4.21875 23.523438 -7.769531 18.984375 -12.34375 C 14.441406 -16.925781 10.859375 -22.398438 8.234375 -28.765625 C 5.609375 -35.140625 4.296875 -42.171875 4.296875 -49.859375 C 4.296875 -57.609375 5.609375 -64.664062 8.234375 -71.03125 C 10.859375 -77.40625 14.441406 -82.847656 18.984375 -87.359375 C 23.523438 -91.878906 28.828125 -95.375 34.890625 -97.84375 C 40.960938 -100.3125 47.445312 -101.546875 54.34375 -101.546875 C 57.507812 -101.546875 60.632812 -101.148438 63.71875 -100.359375 C 66.800781 -99.566406 69.804688 -98.484375 72.734375 -97.109375 C 75.660156 -95.734375 78.445312 -94.097656 81.09375 -92.203125 C 83.75 -90.316406 86.265625 -88.304688 88.640625 -86.171875 L 98.34375 -97.796875 L 104.390625 -97.796875 Z M 79.21875 -49.859375 C 79.21875 -53.273438 78.5625 -56.582031 77.25 -59.78125 C 75.945312 -62.988281 74.164062 -65.828125 71.90625 -68.296875 C 69.644531 -70.765625 67.003906 -72.742188 63.984375 -74.234375 C 60.972656 -75.734375 57.757812 -76.484375 54.34375 -76.484375 C 50.925781 -76.484375 47.707031 -75.859375 44.6875 -74.609375 C 41.664062 -73.359375 39.039062 -71.570312 36.8125 -69.25 C 34.59375 -66.9375 32.84375 -64.144531 31.5625 -60.875 C 30.28125 -57.613281 29.640625 -53.941406 29.640625 -49.859375 C 29.640625 -45.648438 30.28125 -41.882812 31.5625 -38.5625 C 32.84375 -35.238281 34.59375 -32.445312 36.8125 -30.1875 C 39.039062 -27.9375 41.664062 -26.210938 44.6875 -25.015625 C 47.707031 -23.828125 50.925781 -23.234375 54.34375 -23.234375 C 57.757812 -23.234375 60.972656 -23.976562 63.984375 -25.46875 C 67.003906 -26.96875 69.644531 -28.953125 71.90625 -31.421875 C 74.164062 -33.890625 75.945312 -36.722656 77.25 -39.921875 C 78.5625 -43.128906 79.21875 -46.441406 79.21875 -49.859375 Z M 79.21875 -49.859375 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(497.156754, 167.004935)"><g><path d="M 81.515625 -11.4375 C 79.503906 -9.601562 77.351562 -7.878906 75.0625 -6.265625 C 72.769531 -4.648438 70.375 -3.25 67.875 -2.0625 C 65.375 -0.875 62.796875 0.0664062 60.140625 0.765625 C 57.492188 1.472656 54.796875 1.828125 52.046875 1.828125 C 46.015625 1.828125 40.34375 0.757812 35.03125 -1.375 C 29.726562 -3.507812 25.078125 -6.539062 21.078125 -10.46875 C 17.085938 -14.40625 13.945312 -19.191406 11.65625 -24.828125 C 9.375 -30.472656 8.234375 -36.804688 8.234375 -43.828125 L 8.234375 -97.984375 L 33.125 -97.984375 L 33.125 -43.828125 C 33.125 -40.523438 33.625 -37.578125 34.625 -34.984375 C 35.632812 -32.398438 36.992188 -30.222656 38.703125 -28.453125 C 40.410156 -26.679688 42.40625 -25.335938 44.6875 -24.421875 C 46.976562 -23.503906 49.429688 -23.046875 52.046875 -23.046875 C 54.609375 -23.046875 57.035156 -23.640625 59.328125 -24.828125 C 61.617188 -26.023438 63.613281 -27.597656 65.3125 -29.546875 C 67.019531 -31.503906 68.363281 -33.71875 69.34375 -36.1875 C 70.320312 -38.65625 70.8125 -41.203125 70.8125 -43.828125 L 70.8125 -97.984375 L 95.78125 -97.984375 L 95.78125 0 L 89.75 0 Z M 81.515625 -11.4375 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(625.126233, 167.004935)"><g><path d="M 38.96875 -124.59375 C 38.96875 -122.28125 38.523438 -120.117188 37.640625 -118.109375 C 36.753906 -116.097656 35.550781 -114.34375 34.03125 -112.84375 C 32.507812 -111.351562 30.722656 -110.164062 28.671875 -109.28125 C 26.628906 -108.394531 24.453125 -107.953125 22.140625 -107.953125 C 19.816406 -107.953125 17.632812 -108.394531 15.59375 -109.28125 C 13.550781 -110.164062 11.78125 -111.351562 10.28125 -112.84375 C 8.789062 -114.34375 7.601562 -116.097656 6.71875 -118.109375 C 5.832031 -120.117188 5.390625 -122.28125 5.390625 -124.59375 C 5.390625 -126.851562 5.832031 -129.003906 6.71875 -131.046875 C 7.601562 -133.085938 8.789062 -134.851562 10.28125 -136.34375 C 11.78125 -137.84375 13.550781 -139.035156 15.59375 -139.921875 C 17.632812 -140.804688 19.816406 -141.25 22.140625 -141.25 C 24.453125 -141.25 26.628906 -140.804688 28.671875 -139.921875 C 30.722656 -139.035156 32.507812 -137.84375 34.03125 -136.34375 C 35.550781 -134.851562 36.753906 -133.085938 37.640625 -131.046875 C 38.523438 -129.003906 38.96875 -126.851562 38.96875 -124.59375 Z M 34.671875 0 L 9.515625 0 L 9.515625 -97.984375 L 34.671875 -97.984375 Z M 34.671875 0 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(691.9844, 167.004935)"><g><path d="M 34.671875 0 L 9.515625 0 L 9.515625 -136.953125 L 34.671875 -136.953125 Z M 34.671875 0 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(758.842567, 167.004935)"><g><path d="M 38.96875 -124.59375 C 38.96875 -122.28125 38.523438 -120.117188 37.640625 -118.109375 C 36.753906 -116.097656 35.550781 -114.34375 34.03125 -112.84375 C 32.507812 -111.351562 30.722656 -110.164062 28.671875 -109.28125 C 26.628906 -108.394531 24.453125 -107.953125 22.140625 -107.953125 C 19.816406 -107.953125 17.632812 -108.394531 15.59375 -109.28125 C 13.550781 -110.164062 11.78125 -111.351562 10.28125 -112.84375 C 8.789062 -114.34375 7.601562 -116.097656 6.71875 -118.109375 C 5.832031 -120.117188 5.390625 -122.28125 5.390625 -124.59375 C 5.390625 -126.851562 5.832031 -129.003906 6.71875 -131.046875 C 7.601562 -133.085938 8.789062 -134.851562 10.28125 -136.34375 C 11.78125 -137.84375 13.550781 -139.035156 15.59375 -139.921875 C 17.632812 -140.804688 19.816406 -141.25 22.140625 -141.25 C 24.453125 -141.25 26.628906 -140.804688 28.671875 -139.921875 C 30.722656 -139.035156 32.507812 -137.84375 34.03125 -136.34375 C 35.550781 -134.851562 36.753906 -133.085938 37.640625 -131.046875 C 38.523438 -129.003906 38.96875 -126.851562 38.96875 -124.59375 Z M 34.671875 0 L 9.515625 0 L 9.515625 -97.984375 L 34.671875 -97.984375 Z M 34.671875 0 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(825.700733, 167.004935)"><g><path d="M 107.578125 -49.859375 C 107.578125 -42.171875 106.265625 -35.15625 103.640625 -28.8125 C 101.023438 -22.46875 97.457031 -17.023438 92.9375 -12.484375 C 88.425781 -7.941406 83.132812 -4.421875 77.0625 -1.921875 C 71 0.578125 64.492188 1.828125 57.546875 1.828125 C 50.648438 1.828125 44.164062 0.546875 38.09375 -2.015625 C 32.03125 -4.578125 26.726562 -8.144531 22.1875 -12.71875 C 17.644531 -17.289062 14.0625 -22.734375 11.4375 -29.046875 C 8.8125 -35.359375 7.5 -42.296875 7.5 -49.859375 L 7.5 -136.953125 L 32.5625 -136.953125 L 32.5625 -91.203125 C 33.90625 -92.910156 35.535156 -94.4375 37.453125 -95.78125 C 39.378906 -97.125 41.453125 -98.222656 43.671875 -99.078125 C 45.898438 -99.929688 48.203125 -100.585938 50.578125 -101.046875 C 52.960938 -101.503906 55.285156 -101.734375 57.546875 -101.734375 C 64.492188 -101.734375 71 -100.4375 77.0625 -97.84375 C 83.132812 -95.25 88.425781 -91.632812 92.9375 -87 C 97.457031 -82.363281 101.023438 -76.890625 103.640625 -70.578125 C 106.265625 -64.265625 107.578125 -57.359375 107.578125 -49.859375 Z M 82.421875 -49.859375 C 82.421875 -53.640625 81.765625 -57.160156 80.453125 -60.421875 C 79.148438 -63.679688 77.367188 -66.5 75.109375 -68.875 C 72.847656 -71.257812 70.207031 -73.125 67.1875 -74.46875 C 64.175781 -75.8125 60.960938 -76.484375 57.546875 -76.484375 C 54.128906 -76.484375 50.910156 -75.734375 47.890625 -74.234375 C 44.867188 -72.742188 42.226562 -70.765625 39.96875 -68.296875 C 37.71875 -65.828125 35.953125 -62.988281 34.671875 -59.78125 C 33.390625 -56.582031 32.75 -53.273438 32.75 -49.859375 C 32.75 -46.078125 33.390625 -42.566406 34.671875 -39.328125 C 35.953125 -36.097656 37.71875 -33.296875 39.96875 -30.921875 C 42.226562 -28.546875 44.867188 -26.671875 47.890625 -25.296875 C 50.910156 -23.921875 54.128906 -23.234375 57.546875 -23.234375 C 60.960938 -23.234375 64.175781 -23.921875 67.1875 -25.296875 C 70.207031 -26.671875 72.847656 -28.546875 75.109375 -30.921875 C 77.367188 -33.296875 79.148438 -36.097656 80.453125 -39.328125 C 81.765625 -42.566406 82.421875 -46.078125 82.421875 -49.859375 Z M 82.421875 -49.859375 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(960.25711, 167.004935)"><g><path d="M 34.484375 0 L 9.515625 0 L 9.515625 -97.984375 L 15.546875 -97.984375 L 23.78125 -86.359375 C 27.8125 -90.015625 32.382812 -92.832031 37.5 -94.8125 C 42.625 -96.800781 47.929688 -97.796875 53.421875 -97.796875 L 75.46875 -97.796875 L 75.46875 -72.90625 L 53.421875 -72.90625 C 50.804688 -72.90625 48.335938 -72.414062 46.015625 -71.4375 C 43.703125 -70.46875 41.691406 -69.128906 39.984375 -67.421875 C 38.273438 -65.710938 36.929688 -63.695312 35.953125 -61.375 C 34.972656 -59.0625 34.484375 -56.59375 34.484375 -53.96875 Z M 34.484375 0 "/></g></g></g><g fill="#ffffff" fill-opacity="1"><g transform="translate(1060.506984, 167.004935)"><g><path d="M 48.484375 -23.96875 C 49.460938 -23.664062 50.4375 -23.46875 51.40625 -23.375 C 52.382812 -23.28125 53.363281 -23.234375 54.34375 -23.234375 C 56.78125 -23.234375 59.125 -23.566406 61.375 -24.234375 C 63.632812 -24.910156 65.753906 -25.875 67.734375 -27.125 C 69.722656 -28.375 71.492188 -29.894531 73.046875 -31.6875 C 74.609375 -33.488281 75.875 -35.488281 76.84375 -37.6875 L 95.140625 -19.296875 C 92.828125 -16.003906 90.160156 -13.046875 87.140625 -10.421875 C 84.117188 -7.804688 80.851562 -5.582031 77.34375 -3.75 C 73.84375 -1.914062 70.15625 -0.53125 66.28125 0.40625 C 62.40625 1.351562 58.425781 1.828125 54.34375 1.828125 C 47.445312 1.828125 40.960938 0.546875 34.890625 -2.015625 C 28.828125 -4.578125 23.523438 -8.144531 18.984375 -12.71875 C 14.441406 -17.289062 10.859375 -22.734375 8.234375 -29.046875 C 5.609375 -35.359375 4.296875 -42.296875 4.296875 -49.859375 C 4.296875 -57.609375 5.609375 -64.679688 8.234375 -71.078125 C 10.859375 -77.484375 14.441406 -82.941406 18.984375 -87.453125 C 23.523438 -91.972656 28.828125 -95.484375 34.890625 -97.984375 C 40.960938 -100.484375 47.445312 -101.734375 54.34375 -101.734375 C 58.425781 -101.734375 62.421875 -101.242188 66.328125 -100.265625 C 70.234375 -99.285156 73.9375 -97.878906 77.4375 -96.046875 C 80.945312 -94.222656 84.222656 -91.984375 87.265625 -89.328125 C 90.316406 -86.679688 93.003906 -83.710938 95.328125 -80.421875 Z M 61.296875 -75.46875 C 60.140625 -75.894531 58.992188 -76.171875 57.859375 -76.296875 C 56.734375 -76.421875 55.5625 -76.484375 54.34375 -76.484375 C 50.925781 -76.484375 47.707031 -75.859375 44.6875 -74.609375 C 41.664062 -73.359375 39.039062 -71.570312 36.8125 -69.25 C 34.59375 -66.9375 32.84375 -64.144531 31.5625 -60.875 C 30.28125 -57.613281 29.640625 -53.941406 29.640625 -49.859375 C 29.640625 -48.941406 29.6875 -47.90625 29.78125 -46.75 C 29.875 -45.59375 30.023438 -44.414062 30.234375 -43.21875 C 30.453125 -42.03125 30.710938 -40.890625 31.015625 -39.796875 C 31.316406 -38.703125 31.710938 -37.726562 32.203125 -36.875 Z M 61.296875 -75.46875 "/></g></g></g><g clip-path="url(#id1)"><path fill="#cd74cc" d="M 59.644531 16.277344 L 157.253906 16.277344 C 166.878906 16.277344 174.679688 24.097656 174.679688 33.746094 C 174.679688 43.394531 166.878906 51.214844 157.253906 51.214844 L 59.644531 51.214844 C 50.019531 51.214844 42.21875 43.394531 42.21875 33.746094 C 42.21875 24.097656 50.019531 16.277344 59.644531 16.277344 " fill-opacity="1" fill-rule="nonzero"/></g><g clip-path="url(#id2)"><path fill="#ffbd59" d="M 39.925781 74.6875 L 176.859375 74.6875 C 186.480469 74.6875 194.277344 82.507812 194.277344 92.15625 C 194.277344 101.804688 186.480469 109.625 176.859375 109.625 L 39.925781 109.625 C 30.308594 109.625 22.507812 101.804688 22.507812 92.15625 C 22.507812 82.507812 30.308594 74.6875 39.925781 74.6875 " fill-opacity="1" fill-rule="nonzero"/></g><g clip-path="url(#id3)"><path fill="#70dd88" d="M 59.644531 133.097656 L 157.253906 133.097656 C 166.878906 133.097656 174.679688 140.917969 174.679688 150.566406 C 174.679688 160.214844 166.878906 168.035156 157.253906 168.035156 L 59.644531 168.035156 C 50.019531 168.035156 42.21875 160.214844 42.21875 150.566406 C 42.21875 140.917969 50.019531 133.097656 59.644531 133.097656 " fill-opacity="1" fill-rule="nonzero"/></g>
    </SvgIcon>
  );
}

const { CONNECT_WALLET,CONNECTION_DISCONNECTED, ACCOUNT_CONFIGURED, ACCOUNT_CHANGED, FIXED_FOREX_BALANCES_RETURNED, FIXED_FOREX_CLAIM_VECLAIM, FIXED_FOREX_VECLAIM_CLAIMED, FIXED_FOREX_UPDATED, ERROR } = ACTIONS

function WrongNetworkIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0 0 64 64" strokeWidth="1" className={className}>
      <g strokeWidth="2" transform="translate(0, 0)"><path fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" d="M33.994,42.339 C36.327,43.161,38,45.385,38,48c0,3.314-2.686,6-6,6c-2.615,0-4.839-1.673-5.661-4.006" strokeLinejoin="miter"></path> <path fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" d="M47.556,32.444 C43.575,28.462,38.075,26,32,26c-6.075,0-11.575,2.462-15.556,6.444" strokeLinejoin="miter"></path> <path fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" d="M59.224,21.276 C52.256,14.309,42.632,10,32,10c-10.631,0-20.256,4.309-27.224,11.276" strokeLinejoin="miter"></path> <line data-color="color-2" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" x1="10" y1="54" x2="58" y2="6" strokeLinejoin="miter"></line></g>
      </SvgIcon>
  );
}

const StyledMenu = withStyles({
  paper: {
    border: '1px solid rgba(126,153,176,0.2)',
    marginTop: '10px',
    minWidth: '230px',
  },
})((props) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: 'none',
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: '#FFF',
      },
    },
  },
}))(MenuItem);

const Img = styled('img')({
  margin: 'auto',
  display: 'block',
  maxWidth: '100%',
  height: '40px'
});


const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 45,
    height: 26,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    paddingTop: 1.5,
    width: '70%',
    margin: 'auto',
    borderRadius: '20px',
    '&$checked': {
      paddingTop: '6px',
      transform: 'translateX(18px)',
      color: 'rgba(128,128,128, 1)',
      width: '25px',
      height: '25px',
      '& + $track': {
        backgroundColor: 'rgba(0,0,0, 0.3)',
        opacity: 1,
      },
    },
    '&$focusVisible $thumb': {
      color: '#ffffff',
      border: '6px solid #fff',
    },
  },
  track: {
    borderRadius: 32 / 2,
    border: '1px solid rgba(104,108,122, 0.25)',
    backgroundColor: 'rgba(0,0,0, 0)',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});


const StyledBadge = withStyles((theme) => ({
  badge: {
    background: '#06D3D7',
    color: '#000'
  },
}))(Badge);

function Header(props) {

  const accountStore = stores.accountStore.getStore('account');
  const router = useRouter();

  const [account, setAccount] = useState(accountStore);
  const [darkMode, setDarkMode] = useState(props.theme.palette.type === 'dark' ? true : false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [chainInvalid, setChainInvalid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactionQueueLength, setTransactionQueueLength] = useState(0)

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };
    const accountChanged = () => {
      const invalid = stores.accountStore.getStore('chainInvalid');
      setChainInvalid(invalid)
    }

    const invalid = stores.accountStore.getStore('chainInvalid');
    setChainInvalid(invalid)

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(CONNECT_WALLET, connectWallet);
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(CONNECT_WALLET, connectWallet);
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
    };
  }, []);

  const handleToggleChange = (event, val) => {
    setDarkMode(val);
    props.changeTheme(val);
  };

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem('yearn.finance-dark-mode');
    setDarkMode(localStorageDarkMode ? localStorageDarkMode === 'dark' : false);
  }, []);

  const navigate = (url) => {
    router.push(url)
  }

  const callClaim = () => {
    setLoading(true)
    stores.dispatcher.dispatch({ type: FIXED_FOREX_CLAIM_VECLAIM, content: {} })
  }

  const switchChain = async () => {
    let hexChain = '0x'+Number(process.env.NEXT_PUBLIC_CHAINID).toString(16)
    console.log('hexChain', hexChain)

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChain }],
      });
    } catch (err) {
        
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: 'Kava EVM Co-Chain',
              chainId: process.env.NEXT_PUBLIC_CHAINID,
              nativeCurrency: { name: 'KAVA', decimals: 18, symbol: 'KAVA' },
              rpcUrls: [walletlink.url]
            }
          ]
        });
      }
    }

  }

  const setQueueLength = (length) => {
    setTransactionQueueLength(length)
  }

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <div>
      <div className={classes.headerContainer}>

        <div className={classes.logoContainer}>
          <a onClick={() => router.push('/home')}><SiteLogo className={classes.appLogo} /></a>          
        </div>

        <Navigation changeTheme={props.changeTheme} />

        <div className={classes.containerMenuWallet}>

          { process.env.NEXT_PUBLIC_CHAINID == '4002' &&
            <div className={ classes.testnetDisclaimer}>
              <Typography className={ classes.testnetDisclaimerText}>Testnet</Typography>
            </div>
          }

          { transactionQueueLength > 0 &&
            <IconButton
              className={classes.accountButton}
              variant="contained"
              color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
              onClick={ () => {
                  stores.emitter.emit(ACTIONS.TX_OPEN)
                }
              }>
              <StyledBadge badgeContent={transactionQueueLength} color="secondary" overlap="circular" >
                <ListIcon className={ classes.iconColor}/>
              </StyledBadge>
            </IconButton>
          }

          {account && account.address ?
          <div>

          
          <Grid container>            
                      
              <Grid container className={classes.containerMenu} alignItems="flex-end" justifyContent="center">

                  <Grid className={classes.headAccountBalance}>
                    <Typography className={classes.headBtnTxt}>{'0 KAVA'}</Typography>
                  </Grid>

                  <Grid>

                    <Button
                        disableElevation
                        className={classes.accountButton}
                        variant="contained"
                        color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
                        aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                        {account && account.address && <div className={`${classes.accountIcon}`}></div>}
                        <Typography className={classes.headBtnTxt}>{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>
                        <IconButton onClick={handleClick} className={ classes.filterButton } aria-label="filter list">                      
                          <Img alt="complex" className={ classes.imgIconList } src="/images/Wallet_Icon.svg" />
                      </IconButton>          
                      
                      </Button>

                  </Grid>

              </Grid>
                                                    
          </Grid>          
         
          <StyledMenu
            id="customized-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            className={classes.userMenu}
          >
            <StyledMenuItem className={classes.hidden} onClick={() => router.push('/dashboard')}>
              <ListItemIcon className={classes.userMenuIcon}>
                <DashboardOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText className={classes.userMenuText} primary="Dashboard" />
            </StyledMenuItem>
            <StyledMenuItem onClick={onAddressClicked}>
              <ListItemIcon className={classes.userMenuIcon}>
                <AccountBalanceWalletOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText className={classes.userMenuText} primary="Switch Wallet Provider" />
            </StyledMenuItem>
          </StyledMenu>
          </div>
          :
          <Button
            disableElevation
            className={classes.accountButton}
            variant="contained"
            color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
            onClick={onAddressClicked}>
            {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
            <Typography className={classes.headBtnTxt}>{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>

            <IconButton onClick={handleClick} className={ classes.filterButton } aria-label="filter list">                      
                <Img alt="complex" className={ classes.imgIconList } src="/images/Wallet_Icon.svg" />
             </IconButton>    
          </Button>
          }

        </div>

        {account && account.address &&
          <IconButton onClick={handleClick} className={ classes.filterButton } aria-label="filter list">                      
              <Img alt="complex" className={ classes.imgIconList } src="/images/Linktree_icon.svg" width={'100%'}/>
          </IconButton>          
        }
               
        {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
        <TransactionQueue setQueueLength={ setQueueLength } />
    </div>
    {chainInvalid ? (
      <div className={classes.chainInvalidError}>
        <div className={classes.ErrorContent}>
          <WrongNetworkIcon className={ classes.networkIcon } />
          <Typography className={classes.ErrorTxt}>
            The chain you're connected to isn't supported. Please check that your wallet is connected to KAVA Mainnet.
          </Typography>
          <Button className={classes.switchNetworkBtn} variant="contained" onClick={()=>switchChain()} >Switch to { process.env.NEXT_PUBLIC_CHAINID == '2221' ? 'KAVA Testnet' : 'KAVA Mainnet' }</Button>
        </div>
      </div>
    ) : null}
    </div>
  );
}

export default withTheme(Header);
