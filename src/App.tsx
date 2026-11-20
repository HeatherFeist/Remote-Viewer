import { useEffect, useState, type FormEvent } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { addMemory, addRoomMessage, canSync as _unused, createAccessCode, listMemorials, readViewing, replaceViewing, saveMemorial } from './store';
