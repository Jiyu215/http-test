import * as React from "react";
import ReactDOM from 'react-dom'; // ReactDOM을 명시적으로 import
import * as kurentoUtils from 'kurento-utils'; //이렇게 설정해야 webrtc undefined오류가 뜨지않음
import { useLocation, useNavigate } from "react-router-dom"; // Outlet을 사용하여 하위 라우트 렌더링
import { useEffect, useRef, useState } from 'react';
import WaitingRoom from "../WaitingRoom/WaitingRoom";
import { VideoCameraFilled, VideoCameraOutlined, AudioOutlined, AudioMutedOutlined, CommentOutlined, SmileOutlined, PhoneOutlined, CloseOutlined, SendOutlined, SettingOutlined, LeftOutlined, RightOutlined, DownOutlined, UpOutlined, DesktopOutlined } from "@ant-design/icons";
import { message } from "antd";


//Participant 클래스 정의
class Participant{
    constructor(userId, userName, sendMessage, isMainVideo, videoOn, audioOn){
        this.userId = userId;
        this.userName = userName;
        this.rtcPeer = null;
        this.sendMessage = sendMessage;
        this.isMainVideo = isMainVideo;
        this.videoOn = videoOn;
        this.audioOn = audioOn;

        // videoOn과 audioOn이 문자열이면 불린으로 변환
        this.videoOn = this.convertToBoolean(videoOn);
        this.audioOn = this.convertToBoolean(audioOn);

        const container = document.createElement('div');
        const span = document.createElement('span');
	    const video = document.createElement('video');
        const videoContainer = document.createElement('div');

        const audioOff = document.createElement('span'); // 오디오 꺼짐 표시
        const emojiContainer = document.createElement('div'); // 이모지 컨테이너 추가

        container.id = userId;
        videoContainer.id = 'video-container';

        container.appendChild(videoContainer);
        videoContainer.appendChild(video);
        videoContainer.appendChild(audioOff); // 오디오 꺼짐 표시
        videoContainer.appendChild(emojiContainer); // 이모지 컨테이너 추가
        container.appendChild(span);

        //참가자 메인 비디오, 서브 비디오 설정
        if(this.isMainVideo){
            document.getElementById('mainVideo').appendChild(container);
        }else{
            document.querySelector('.slider-box').appendChild(container);
        }

        span.appendChild(document.createTextNode(userName));

        video.id = 'video-' + userId;
        video.autoplay = true;
        video.controls = false;

        // 메인 비디오 변경 클릭 이벤트
        container.addEventListener('click', () => {
            const mainVideoContainer = document.getElementById('mainVideo'); //메인 비디오
            const sliderBox = document.querySelector('.slider-box'); //서브 비디오

            // 클릭된 컨테이너가 이미 메인 비디오에 있으면 아무 일도 하지 않음
            if (container.closest('#mainVideo')) return;

            // 기존 메인 비디오를 서브 비디오에 추가
            const currentMainContainer = mainVideoContainer.querySelector('div');
            if (currentMainContainer) {
                sliderBox.appendChild(currentMainContainer);
            }

            // 클릭된 비디오를 메인 비디오로 이동
            mainVideoContainer.appendChild(container);
        });

        emojiContainer.id = 'emoji-' + userId; // 이모지 컨테이너에 id 추가
        audioOff.classList.add('audio-off'); // 클래스 이름 추가
        audioOff.style.display = this.audioOn ? 'none' : 'block';

        //임의로 audioOff 아이콘 추가
        audioOff.innerHTML = `
            <span role="img" aria-label="audio-muted" class="anticon anticon-audio-muted">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="audio-muted" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                    <path d="M682 455V311l-76 76v68c-.1 50.7-42 92.1-94 92a95.8 95.8 0 01-52-15l-54 55c29.1 22.4 65.9 36 106 36 93.8 0 170-75.1 170-168z"></path>
                    <path d="M833 446h-60c-4.4 0-8 3.6-8 8 0 140.3-113.7 254-254 254-63 0-120.7-23-165-61l-54 54a334.01 334.01 0 00179 81v102H326c-13.9 0-24.9 14.3-25 32v36c.1 4.4 2.9 8 6 8h408c3.2 0 6-3.6 6-8v-36c0-17.7-11-32-25-32H547V782c165.3-17.9 294-157.9 294-328 0-4.4-3.6-8-8-8zm13.1-377.7l-43.5-41.9a8 8 0 00-11.2.1l-129 129C634.3 101.2 577 64 511 64c-93.9 0-170 75.3-170 168v224c0 6.7.4 13.3 1.2 19.8l-68 68A252.33 252.33 0 01258 454c-.2-4.4-3.8-8-8-8h-60c-4.4 0-8 3.6-8 8 0 53 12.5 103 34.6 147.4l-137 137a8.03 8.03 0 000 11.3l42.7 42.7c3.1 3.1 8.2 3.1 11.3 0L846.2 79.8l.1-.1c3.1-3.2 3-8.3-.2-11.4zM417 401V232c0-50.6 41.9-92 94-92 46 0 84.1 32.3 92.3 74.7L417 401z"></path>
                </svg>
            </span>
        `;

        this.getElement = () => {
            return container;
        }
    
        this.getVideoElement = () => {
            return video;
        }    
        // 참가자 이름 변경
        this.updateUserName = (newName) => {
            this.userName = newName;
            span.textContent = newName;  // 화면 상의 이름도 업데이트
        };

        // 참가자 비디오 상태 업데이트
        this.updateUserVideo = (newVideoState) => {
            this.videoOn = newVideoState;
        }
        
        // 참가자 오디오 상태 업데이트
        this.updateUserAudio = (newAudioState) => {
            this.audioOn = newAudioState;
            
            if (this.audioOn) {
                audioOff.style.display = 'none'; // 오디오 켜졌을 때 숨김
            } else {
                audioOff.style.display = 'block'; // 오디오 꺼졌을 때 표시
            }
        }
    }
    
    convertToBoolean(value) {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';  // 문자열 "true" -> true, 그 외의 문자열은 false
        }
        return Boolean(value);  // 이미 true/false인 경우 그대로 반환
    }
    
    offerToReceiveVideo = (error, offerSdp, wp) => {
		if (error) return console.error ("sdp offer error")
		console.log('Invoking SDP offer callback function');

		var msg =  { 
                eventId : "receiveVideoFrom",
				userId : this.userId,
				sdpOffer : offerSdp
		};
        console.log("오퍼 전송 메시지:", msg); // 전송할 메시지 확인용 로그
		this.sendMessage(msg);
	}

    onIceCandidate = (candidate, wp) => {
        const message = {
            eventId: 'onIceCandidate',
            userId: this.userId,
            candidate: candidate,
        }

        this.sendMessage(message);
    }

    dispose = () => {
        if(this.rtcPeer){
            this.rtcPeer.dispose();
            this.rtcPeer = null;
        }
    }
}

const VideoRoom = () =>{
    const navigate = useNavigate();
    const location = useLocation();
    const action = location.state?.action;

    const [userData, setUserData] = useState({userId:"", userName: "", roomId: "", videoOn: true, audioOn: true }); // 백엔드에서 받은 사용자 데이터 저장
    const [prevUserData, setPrevUserData] = useState({ userId:"", userName: "", roomId: "", videoOn: true, audioOn: true }); // 대기실 사용자 데이터(이전 데이터)
    const [creatorData, setCreatorData] = useState({userId:"", userName: ""});
    const [participants, setParticipants] = useState({}); // 참가자 목록을 상태로 관리
    const userDataRef = useRef(userData); //내 정보 참조

    const [isSharing, setIsSharing] = useState(false);
    const [chatOn, setChatOn] = useState(false);
    const [emojiOn, setEmojiOn] = useState(false);
    const [leftWidth, setLeftWidth] = useState('100%');
    const [rightWidth, setRightWidth] = useState('0%');
    const [displayOn, setDisplayOn] = useState('none');
    const [userEvents, setUserEvents] = useState([]); //사용자 이벤트 메시지 상태
    const [chatMessages, setChatMessages] = useState([]);  // 채팅 메시지 상태
    const [emojiMessages, setEmojiMessages] = useState([]); // 이모지 메시지 상태
    const [sendChat, setSendChat] = useState("");  // 새 메시지 상태
    const [sendEmoji, setSendEmoji] = useState(""); // 새 이모지 상태
    const [changeUserName, setchangeUserName] = useState("");

    //참가자 목록 on, off
    const [listOpen, setListOpen] = useState(false);

    //비디오/오디오 변경
    const [showModal, setShowModal] = useState(false); // 모달 상태
    const [selectedVideoDevice, setSelectedVideoDevice] = useState(''); // 비디오 장치 선택
    const [selectedAudioDevice, setSelectedAudioDevice] = useState(''); // 오디오 장치 선택
    const [videoDevices, setVideoDevices] = useState([]); // 비디오 장치 목록
    const [audioDevices, setAudioDevices] = useState([]); // 오디오 장치 목록
    const [stream, setStream] = useState(null); // 비디오 스트림
    const [screenStream, setScreenStream] = useState(null);
    const streamRef = useRef(null); // 기존 카메라 스트림 저장용

    const [speakingOrder, setSpeakingOrder] = useState([]); //말하는 사람 순서
    const [joinedOrder, setJoinedOrder] = useState([]); // 참가자 입장 순서


    // 음성 인식
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 참가자별로 음성 감지를 추적하는 객체
    const audioDetectionState = {};
    
    const emojis = [
        { src: "/images/emoji/1F44F.svg", alt: "Clapping Hands", name: "Clapping Hands" },
        { src: "/images/emoji/1F62D.svg", alt: "Crying Face", name: "Crying Face" },
        { src: "/images/emoji/1F62F.svg", alt: "Astonished Face", name: "Astonished Face" },
        { src: "/images/emoji/1F64C.svg", alt: "Raising Hands", name: "Raising Hands" },
        { src: "/images/emoji/1F602.svg", alt: "Laughing Face", name: "Laughing Face" },
        { src: "/images/emoji/2764.svg", alt: "Heart", name: "Heart" },
      ]; //이모지 목록
    
    //비디오 슬라이드
    const [currentSlide, setCurrentSlide] = useState(0); // 현재 슬라이드 인덱스 상태
    const [totalSlides, setTotalSlides] = useState(0); //슬라이드 아이템 개수
    const visibleItemsCount = 5; //화면에 보여지는 비디오 개수
    const isSlideButtonDisabled = totalSlides <= 6; //버튼 활성화,비활성화

    // 슬라이드 왼쪽 이동 함수
    const slideLeft = () => {
        if (currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
        }
    };

    // 슬라이드 오른쪽 이동 함수
    const slideRight = () => {
        if (currentSlide < totalSlides - visibleItemsCount) {
            setCurrentSlide(currentSlide + 1);
          }
    };

    const toggleList = () => {
        setListOpen(!listOpen);
    }
    
    const wsServerUrl = "ws://localhost:8080";
    const ws = useRef(null);  // 웹소켓 연결을 위한 ref    

    const handleUserDataChange = (data) => {
        setPrevUserData((prevUserData) => ({
            ...prevUserData, // 기존 상태를 복사
            ...data // 새 데이터로 덮어쓰기
        }));

        setUserData((userData) => ({
            ...userData, // 기존 상태를 복사
            ...data // 새 데이터로 덮어쓰기
        }));
    };

    useEffect(() => {
        const mainVideoContainer = document.getElementById('mainVideo');
        const sliderBox = document.querySelector('.slider-box');
        if (!mainVideoContainer || !sliderBox) return;
      
        // 누가 말하고 있는지에 따라 순서를 정함
        if (speakingOrder.length > 0) {
          const mainUserId = speakingOrder[0];
          const mainElem = participants[mainUserId]?.getElement();
      
          // 현재 메인 비디오와 다르면 교체
          const currentMain = mainVideoContainer.querySelector('div');
          if (mainElem && currentMain !== mainElem) {
            if (currentMain) sliderBox.appendChild(currentMain);
            mainVideoContainer.appendChild(mainElem);
          }
      
          // 슬라이더 비디오 순서 정렬
          const remaining = Object.keys(participants).filter(id => id !== mainUserId);
          const sorted = [...speakingOrder.slice(1), ...remaining.filter(id => !speakingOrder.includes(id))];
      
          // 슬라이더 초기화
          sorted.forEach(userId => {
            const elem = participants[userId]?.getElement();
            if (elem && elem.parentElement !== sliderBox) {
              sliderBox.appendChild(elem);
            } else if (elem) {
              sliderBox.appendChild(elem); // 순서 재정렬
            }
          });
        }
      
      }, [speakingOrder]);
      

    useEffect(() => {
        userDataRef.current = { ...userData };
        const stream = document.getElementById(`video-${userDataRef.current.userId}`)?.srcObject;
        console.log("stream",stream);
        if (stream) {
            // 비디오 트랙 활성화/비활성화
            stream.getVideoTracks().forEach(track => {
                track.enabled = userDataRef.current.videoOn;
            });
            
            // 오디오 트랙 활성화/비활성화
            stream.getAudioTracks().forEach(track => {
                track.enabled = userDataRef.current.audioOn;
            });

        }
      }, [userData]); // userData가 변경될 때마다 실행됨

      useEffect(()=>{
        console.log("participants",participants);
        setTotalSlides(Object.keys(participants).length);
      },[participants]);
    
    //채팅 & 이모지
    // 공통 함수로 chat과 emoji를 토글하는 함수
    const toggleSection = (section) => {
        console.log(`Toggling section: ${section}`);
        if (section === 'chat') {
            setChatOn(true); // Chat을 활성화
            setEmojiOn(false); // Emoji는 비활성화
        } else if (section === 'emoji') {
            setEmojiOn(true); // Emoji를 활성화
            setChatOn(false); // Chat은 비활성화
        }
    };

    const toggleChat = () => {
        setChatOn(!chatOn);
        if (emojiOn) setEmojiOn(false); // 이모지가 열려있으면 닫기
        setLeftWidth(chatOn ? '100%' : '75%');
        setRightWidth(chatOn ? '0%' : '25%');
        setDisplayOn(chatOn ? 'none' : 'block');
        console.log(`Toggled chat: ${chatOn ? "open" : "closed"}`);
    };

    const toggleEmoji = () => {
        setEmojiOn(!emojiOn);
        if (chatOn) setChatOn(false); // 채팅이 열려있으면 닫기
        setLeftWidth(emojiOn ? '100%' : '75%');
        setRightWidth(emojiOn ? '0%' : '25%');
        setDisplayOn(emojiOn ? 'none' : 'block');
        console.log(`Toggled emoji: ${emojiOn ? "open" : "closed"}`);
    };

    const toggleClose = () => {
        setChatOn(false); // 채팅 닫기
        setEmojiOn(false); // 이모지 닫기
        setLeftWidth('100%'); // 기본 왼쪽 영역 크기
        setRightWidth('0%'); // 기본 오른쪽 영역 크기
        setDisplayOn('none'); // 닫기
        console.log("Closed chat and emoji.");
    };

    //방참가 함수
    const joinRoom = () => {
        const message = {
            eventId: 'joinRoom',
            userName: prevUserData.userName,
            roomId: prevUserData.roomId,
            audioOn: prevUserData.audioOn,
            videoOn: prevUserData.videoOn
        };
        
        setUserData({
            ...userDataRef.current,
            audioOn: prevUserData.audioOn,
            videoOn: prevUserData.videoOn
        });

        sendMessage(message);
    }
    
    //방생성 함수
    const createRoom = () => {
        const message = {
            eventId: 'createRoom',
            userName: prevUserData.userName,
            audioOn: prevUserData.audioOn,
            videoOn: prevUserData.videoOn
        };

        sendMessage(message);
    }

    useEffect(() => {
        if (action === "create" || action === "join") {
            // 방 생성 또는 참가
            if (action === "create") createRoom(); // 방 생성
            if (action === "join") joinRoom(); // 방 참가
        }
    }, [prevUserData, action]); // prevUserData와 action만 의존성으로 사용

    //웹소켓 연결
    useEffect(() => {
        ws.current = new WebSocket(wsServerUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connection opened.');
        };

        ws.current.onmessage = (message) => {
            let parsedMessage = JSON.parse(message.data);
            console.info('Received message: ' + message.data);

            switch (parsedMessage.action) {
                case 'sendExistingUsers': //기존 참가자에게 새로운 참가자 알림
                    sendExistingUsers(parsedMessage);
                    break;
                case 'newUserJoined': //새로운 사용자에게 기존 참가자 알림
                    newUserJoined(parsedMessage);
                    break;
                case 'roomCreated': //새로운 방 생성
                    roomCreated(parsedMessage);
                    break;
                case 'receiveVideoFrom': //비디오 연결
                    receiveVideoResponse(parsedMessage);
                    break;
                case 'onIceCandidate': //사용자 peer연결
                    onIceCandidate(parsedMessage);
                    break;
                case 'sendChat': //전달받은 채팅
                    ReceivedChat(parsedMessage);
                    break;
                case 'sendEmoji': //전달받은 이모지
                    ReceivedEmoji(parsedMessage);
                    break;
                case 'leaderChanged': //방장 변경
                    creatorChanged(parsedMessage);
                    break;
                case 'changeVideoState': //비디오 상태 변경
                    updateVideoState(parsedMessage);
                    break;
                case 'changeAudioState': //오디오 상태 변경
                    updateAudioState(parsedMessage);
                    break;
                case 'changeName':
                    ReceivedChangeName(parsedMessage);
                    break;
                case 'exitRoom': //사용자 방 나가기
                    userLeft(parsedMessage);
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
              }
        };

        return () => {
            if(ws.current){
                console.log("Closing WebSocket connection.");
                ws.current.close();  // 웹소켓 연결 종료
            }
        }
    }, []);

    
    //프론트메시지 백엔드에게 전달하는 함수
    const sendMessage = (message) => {
        let jsonMessage = JSON.stringify(message);
        console.log('Sending message: ' + jsonMessage);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(jsonMessage);
        }
    }
    

    //기존 참가자 데이터를 추출하는 함수
    const parseParticipant = (participantInfo) => {
        // participantInfo가 문자열이면 JSON 파싱 시도
        if (typeof participantInfo === 'string') {
            try {
                const parsed = JSON.parse(participantInfo);
                return {
                    userId: parsed.userId,
                    userName: parsed.userName,
                    audioOn: parsed.audioOn === "true",
                    videoOn: parsed.videoOn === "true"
                };
            } catch (e) {
                console.error("❌ 문자열 파싱 실패:", participantInfo, e);
                return null;
            }
        }
    
        // 이미 객체이면 그대로 필드 꺼내기
        return {
            userId: participantInfo.userId,
            userName: participantInfo.userName,
            audioOn: typeof participantInfo.audioOn === 'string' ? participantInfo.audioOn === "true" : !!participantInfo.audioOn,
            videoOn: typeof participantInfo.videoOn === 'string' ? participantInfo.videoOn === "true" : !!participantInfo.videoOn
        };
    };
    

    //방 생성 후, 백엔드 메시지 받기
    const roomCreated = (response) => {
        const {userId,roomId, userName, videoOn, audioOn} = response;

        setUserData({
            ...userDataRef.current,
            userId: userId,
            roomId: roomId,
            userName: userName,
            videoOn: videoOn,
            audioOn: audioOn
        });
        
        //방 생성시 방코드 채팅에 출력
        setUserEvents(prevEventMessage => [
            ...prevEventMessage,
            {message: `방코드: ${response.roomId}`}
        ]);
        console.log('Received createRoomResponse:', response);
        
        sendExistingUsers(response);
    }

    const newUserJoined = (request) => {
        console.log("새로운 참가자:",request);
        receiveVideo(request);
    }

    useEffect(()=>{
        console.log("creatorData:",creatorData);
    },[creatorData]);
    
    const sendExistingUsers = (msg) => {

        // 첫 번째 참가자에게만 메인 비디오를 할당
        let isMainVideo = Object.keys(participants).length === 0; // 참가자가 없으면 첫 번째 참가자
         
        setCreatorData({
            ...creatorData,
            userId: msg.roomLeaderId,
            userName: msg.roomLeaderName
        });


        // 방 입장 메시지
        setUserEvents(prevEventMessage => [
            ...prevEventMessage,
            { message: `${msg.userName}님이 방에 입장하셨습니다.` }
        ]);
        
        if(!userDataRef.current.userId || userDataRef.current.userId === ''){
            setUserData({
                ...userDataRef.current,
                userId: msg.userId,
                userName: msg.userName
            });
        }
    
        const constraints = {
            audio: true,
            video: true
        };

        // 새 참가자에 대한 참가자 객체 생성
        let participant = new Participant(msg.userId, msg.userName, sendMessage, isMainVideo, userDataRef.current.videoOn, userDataRef.current.audioOn);

        setParticipants(prevParticipants => {
            const updatedParticipants = { ...prevParticipants, [msg.userId]: participant };
            console.log("새 참가자 추가 후 참가자 상태:", updatedParticipants);

            participants[msg.userId] = participant;
            return updatedParticipants;
        });
        
        // 미디어 스트림을 받아오는 로직
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                if (msg.userId === userDataRef.current.userId) {
                    streamRef.current = stream;
                    console.log("✅ 내 스트림 저장 완료:", stream);
                }        

                participant.getVideoElement().srcObject = stream;
                console.log("stream:",stream);
                    var options = {
                        localVideo: participant.getVideoElement(),
                        mediaConstraints: constraints,
                        onicecandidate: participant.onIceCandidate.bind(participant)
                    };
        
                    participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
                        function (error) {
                            if (error) {
                                console.error(error);
                                return;
                            }
                            this.generateOffer(participant.offerToReceiveVideo.bind(participant));
    
                            // 스트림을 받은 후 비디오와 오디오 트랙을 즉시 활성화
                            const videoElement = participant.getVideoElement();
                            if (videoElement && videoElement.srcObject) {
                                const stream = videoElement.srcObject;
    
                                // video와 audio 트랙이 존재하는지 확인하고 활성화
                                if (stream) {
                                    stream.getVideoTracks().forEach(track => {
                                        track.enabled = userDataRef.current.videoOn;  // videoOn에 따라 비디오 트랙 설정
                                    });
    
                                    stream.getAudioTracks().forEach(track => {
                                        track.enabled = userDataRef.current.audioOn;  // audioOn에 따라 오디오 트랙 설정
                                    });
                                }

                                videoElement.onloadedmetadata = () => {
                                    const stream = videoElement.srcObject;
                                    startAudioDetection(participant.userId, stream); // ✅ 감지 시작
                                };
                            }
                        });

                // msg.participants가 정의되어 있고 배열인 경우에만 처리
                if (msg.participants && Array.isArray(msg.participants)) {
                    msg.participants.forEach((existingParticipantInfo) => {
                        // 기존 참가자 처리
                        const existingParticipant = parseParticipant(existingParticipantInfo);
    
                        // 기존 참가자에게 비디오 수신 설정
                        receiveVideo(existingParticipant);
                    });
                }
                
                console.log("최종 참가자 상태:", participants);
            })
            .catch(function (error) {
                console.error("Error accessing media devices:", error);
            });
    };

    const startAudioDetection = (userId, stream) => {
        // 오디오가 켜져 있을 경우에만 소리 감지 시작
        if (!audioDetectionState[userId]) {
            const microphone = audioContext.createMediaStreamSource(stream);
            const analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            microphone.connect(analyserNode);

            audioDetectionState[userId] = {
                microphone,
                analyserNode,
                dataArray,
                bufferLength,
                isSpeaking: false,
            };

            //소리 감지 함수 호출
            detectAudioActivity(userId);
        }
    };
        
    // 소리 감지하는 함수
    const detectAudioActivity = (userId) => {
        // participants 객체에서 해당 userId를 가진 참가자 찾기
        const participant = participants[userId];
        
        if (!participant) {
            console.warn("해당 참가자가 존재하지 않아 음성인식을 종료합니다", userId);
            return; // 참가자가 없으면 함수를 종료
        }

        const { analyserNode, dataArray, bufferLength } = audioDetectionState[userId];
        analyserNode.getByteFrequencyData(dataArray); // 주파수 데이터 가져오기

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }

        // 평균 소리 값 계산
        const average = sum / bufferLength;
        const isSpeaking = average > 10; // 이 값을 기준으로 말을 하고 있다고 판단

        // 참가자가 말을 하고 있으면 콘솔에 출력
        if (isSpeaking && !audioDetectionState[userId].isSpeaking) {
            audioDetectionState[userId].isSpeaking = true;
            console.log(`${participants[userId].userName}님이 말을 하고 있습니다.`);
            setSpeakingOrder(prev => {
                if (!prev.includes(userId)) {
                    return [...prev, userId];
                }
                return prev;
            });
        

        } else if (!isSpeaking && audioDetectionState[userId].isSpeaking) {
            audioDetectionState[userId].isSpeaking = false;
            console.log(`${participants[userId].userName}님이 말을 하고 있지 않습니다.`);

            setSpeakingOrder(prev => prev.filter(id => id !== userId));
        }

        // 계속 감지
        requestAnimationFrame(() => detectAudioActivity(userId));
    };

    const receiveVideoResponse = (result) => {
        participants[result.userId].rtcPeer.processAnswer(result.sdpAnswer, function (error) {
            if (error) return console.error (error);
        });
    }

    const onIceCandidate = (result) => {
        participants[result.userId].rtcPeer.addIceCandidate(result.candidate, function (error) {
	        if (error) {
		      console.error("Error adding candidate: " + error);
		      return;
	        }
	    });
    }

    //onIcecandidate값 전달 함수 - peer 연결
    const receiveVideo = (sender) => {
        console.log("방참가join",sender);

        let participant = participants[sender.userId];
        let isMainVideo = Object.keys(participants).length === 0; // 참가자가 없으면 첫 번째 참가자
        
        if (!participant) {
            // 존재하지 않으면 새로 생성
            participant = new Participant(sender.userId, sender.userName, sendMessage, isMainVideo, sender.videoOn, sender.audioOn);
            setParticipants(prevParticipants => {
                const updatedParticipants = { ...prevParticipants, [sender.userId]: participant };
                console.log("새 참가자 추가 후 참가자 상태:", updatedParticipants);
    
                participants[sender.userId] = participant;
                return updatedParticipants;
            });
            // participants[sender.userId] = participant;
        }

        let options = {
            remoteVideo: participant.getVideoElement(),
            onicecandidate: participant.onIceCandidate.bind(participant)
        }
        
        participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
			function (error) {
                if(error) { 
                    return console.error(error); 
                }
                this.generateOffer(participant.offerToReceiveVideo.bind(participant));
                
                // 오디오 감지를 위해 스트림 할당 대기
                const videoElement = participant.getVideoElement();
                videoElement.onloadedmetadata = () => {
                    const stream = videoElement.srcObject;
                    startAudioDetection(participant.userId, stream); // ✅ 감지 시작
                };
        });
    }

    //채팅 전송
    const sendChatMessage = (sendChat) => {
        if (!sendChat.trim()) { return; } //비어있을 경우 메시지를 보내지 않음

        //채팅을 보낼 참여자 선택
        const selectUser = document.getElementById('userSelect').value;

        const message = {
            eventId: 'sendChat',
            senderId: userData.userId,
            receiverId: selectUser, // 또는 특정 사용자 ID로 변경 가능
            message: sendChat,
            isSendToAll: (selectUser === "ALL") ? true : false
        };

        setChatMessages(prevMessages => [
            ...prevMessages,
            { senderId: userData.userId, senderName: userData.userName, message: sendChat, isSendToAll: message.isSendToAll }
        ]);

        sendMessage(message);
        setSendChat(""); // 입력창 초기화
    }

    const sendEmojiMessage = (sendEmoji) => {
        if(!sendEmoji.trim()) { return; } //비어있을 경우 이모지를 보내지 않음

        //이모지를 보낼 참여자 선택
        const selectUser = document.getElementById('userSelect').value;

        const message = {
            eventId: 'sendEmoji',
            senderId: userData.userId,
            receiverId: selectUser,
            emoji:sendEmoji,
            isSendToAll: (selectUser === userData.userId) ? true : false
        }

        showEmojis(message.receiverId, sendEmoji);

        setEmojiMessages(prevMessages => [
            ...prevMessages,
            { senderId: userData.userId, senderName:userData.userName, emoji: message.emoji, isSendToAll: message.isSendToAll }
        ]);

        sendMessage(message);
        setSendEmoji(""); //입력창 초기화
    }

    //메시지 수신
    const ReceivedChat = (receiveChat) => {
        const { senderId, senderName, message, isSendToAll } = receiveChat;

        // 내가 보낸 메시지는 수신하지 않도록 조건 추가
        if (senderId === userDataRef.current.userId) {
            return; // 내 메시지는 렌더링하지 않음
        }

        // 'isSendToAll' 여부에 따라 메시지 처리
        setChatMessages(prevMessages => [
            ...prevMessages,
            { senderId, senderName, message, isSendToAll }
        ]);
    };

    //이모지 수신
    const ReceivedEmoji = (receiveEmoji) => {
        const { senderId, senderName, receiverId, emoji, isSendToAll } = receiveEmoji;
        

        // 내가 보낸 메시지는 수신하지 않도록 조건 추가
        if (senderId === userDataRef.current.userId) {
            return; // 내 메시지는 렌더링하지 않음
        }
        
        if (!isSendToAll){
            showEmojis(receiverId, emoji);
        }else{
            showEmojis(senderId, emoji);
        }
        
        console.log("이모지:",receiveEmoji);
        setEmojiMessages(prevMessages => [
            ...prevMessages,
            { senderId, senderName, emoji, isSendToAll }
        ]);
    }

    const showEmojis = (senderId, emoji) => {
        // 특정 userId에 해당하는 이모지 컨테이너를 찾기
        const emojiContainer = document.getElementById('emoji-' + senderId);
    
        if (emojiContainer) {
            const emojiCount = Math.floor(Math.random() * 6) + 5; // 최소 5개, 최대 10개까지 랜덤
    
            for (let i = 0; i < emojiCount; i++) {
                // 이모지를 해당 컨테이너에 표시
                const emojiImage = document.createElement('img');
                const emojiData = emojis.find(e => e.name === emoji); // 이모지 이름에 맞는 이모지 객체 찾기
    
                if (emojiData) {
                    emojiImage.src = emojiData.src;
                    emojiImage.alt = emojiData.alt;
    
                    // 스타일 추가 (이모지 위치, 크기, 애니메이션 등)
                    emojiImage.style.position = 'absolute'; // 절대 위치
                    emojiImage.style.left = `${Math.random() * 100}%`; // 랜덤한 좌측 위치
                    emojiImage.style.bottom = '15%'; // 비디오 컨테이너의 하단에서 시작
                    emojiImage.style.width = '10%';  // 이모지 크기
                    emojiImage.style.height = '10%'; // 이모지 크기
                    emojiImage.classList.add('emojiEvents'); // 애니메이션 클래스 추가
    
                    // 각 이모지에 애니메이션 지연 시간 추가
                    emojiImage.style.animationDelay = `${i * 0.5}s`; // 0.5초씩 지연
    
                    // 이모지를 컨테이너에 추가
                    emojiContainer.appendChild(emojiImage);
    
                    // 5초 후에 이모지 삭제
                    setTimeout(() => {
                        emojiContainer.removeChild(emojiImage);
                    }, 5000); // 5초 후에 이모지 제거
                }
            }
        }
    };
    

    //사용자 방 나가기
    const exitRoom = () => {
        const message = {
            eventId: 'exitRoom',
            userId: userDataRef.userId
        };
        
        sendMessage(message);
        navigate('/');
    }

    const userLeft = (request) => {
        let participant = participants[request.userId];  // 참가자 정보를 먼저 찾기
        
        if (participant) {  // 참가자가 존재하는 경우에만 처리   
            const participantDiv = document.getElementById(request.userId);  // 참가자 div 찾기
            const videoElement = document.getElementById(`video-${request.userId}`);  // 참가자 비디오 요소 찾기
            const optionElement = document.querySelector(`#userSelect option[value='${request.userId}']`);

            // 채팅에 사용자 나감 메시지 추가
            setUserEvents(prevEventMessage => [
                ...prevEventMessage, 
                {message: `${participant.userName}님이 방을 나갔습니다.`}
            ]);

            // 참가자 리소스 정리 (WebRTC 연결 종료 등)
            participant.dispose();
    
            // 참가자 목록에서 해당 참가자 제거
            delete participants[request.userId];

            // 해당 참가자의 DOM 요소 삭제 (참여자 비디오 삭제제)
            if (optionElement) optionElement.remove(); //option 요소 삭제
            if (participantDiv) participantDiv.remove();  // div 삭제
            if (videoElement) videoElement.remove();  // 비디오 요소 삭제
            

            setTotalSlides(Object.keys(participants).length);

            
        } else {
            console.warn("해당 userId의 참가자가 없습니다:", request.userId);
        }
    };

    //방장 변경 함수
    const creatorChanged = (request) =>{
        const {roomLeaderId, roomLeaderName} = request;
        setCreatorData({
            ...creatorData,
            userId: roomLeaderId,
            userName: roomLeaderName
        });
    };
    
   // 비디오 상태 변경
    const toggleVideo = () => {
        const newVideoOn = !userData.videoOn;

        // 상태가 같으면 메시지 전송 안 함
        if (userData.videoOn === newVideoOn) {
            return; // 상태가 같으면 전송 안 함
        }

        const message = {
            eventId: 'videoStateChange',
            userId: userData.userId,
            videoOn: newVideoOn
        };

        sendMessage(message);

        // 상태 업데이트
        setUserData(prev => ({
            ...prev,
            videoOn: newVideoOn
        }));
    };

    // 오디오 상태 변경
    const toggleAudio = () => {
        const newAudioOn = !userData.audioOn;

        // 상태가 같으면 메시지 전송 안 함
        if (userData.audioOn === newAudioOn) {
            return; // 상태가 같으면 전송 안 함
        }

        const message = {
            eventId: 'audioStateChange',
            userId: userData.userId,
            audioOn: newAudioOn
        };

        sendMessage(message);

        // 상태 업데이트
        setUserData(prev => ({
            ...prev,
            audioOn: newAudioOn
        }));
    };


    const updateVideoState = ({ userId, videoOn }) => {
        setParticipants(prev => {
            const updated = { ...prev };
            const participant = updated[userId];
            if (participant && participant.videoOn !== videoOn) {
                participant.updateUserVideo(videoOn);
            }
            return updated;
        });
    };
    
    const updateAudioState = ({ userId, audioOn }) => {
        setParticipants(prev => {
            const updated = { ...prev };
            const participant = updated[userId];
            if (participant && participant.audioOn !== audioOn) {
                participant.updateUserAudio(audioOn);
            }
            return updated;
        });
    };


    const toggleScreenShare = async () => {
        const myUserId = userDataRef.current?.userId;
        const participant = participants[myUserId];
        if (!participant || !participant.rtcPeer?.peerConnection) return;

        const peerConnection = participant.rtcPeer.peerConnection;
        const videoElement = participant.getVideoElement();

        setIsSharing(!isSharing);
        if (!isSharing) {
            try {
                const currentStream = videoElement?.srcObject;
                if (currentStream && currentStream.getVideoTracks().length > 0) {
                    streamRef.current = currentStream;
                    console.log("기존 카메라 스트림 저장됨:", streamRef.current);
                }

                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false,
                });

                const screenTrack = screenStream.getVideoTracks()[0];
                const videoSender = peerConnection.getSenders().find(s => s.track?.kind === 'video');

                if (videoSender && screenTrack) {
                    await videoSender.replaceTrack(screenTrack);
                    if (videoElement) videoElement.srcObject = screenStream;

                    // 자동 종료 감지
                    screenTrack.onended = async () => {
                        console.log("화면 공유 종료됨");

                        const originalStream = streamRef.current;
                        const originalTrack = originalStream?.getVideoTracks()[0];

                        if (originalTrack && videoSender) {
                            await videoSender.replaceTrack(originalTrack);
                            if (videoElement) videoElement.srcObject = originalStream;
                        }

                        setIsSharing(false);
                        setScreenStream(null);
                    };

                    setScreenStream(screenStream);
                }
            } catch (err) {
                console.error("화면 공유 실패:", err);
                setIsSharing(false);
            }
        } else {
            // 화면공유 중지
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                console.log("수동 화면 공유 중지");

                const originalStream = streamRef.current;
                const originalTrack = originalStream?.getVideoTracks()[0];
                const videoSender = peerConnection.getSenders().find(s => s.track?.kind === 'video');

                if (originalTrack && videoSender) {
                    await videoSender.replaceTrack(originalTrack);
                    if (videoElement) {
                        videoElement.srcObject = originalStream;
                        originalStream.getVideoTracks().forEach(track => (track.enabled = true));
                    }
                    console.log("기존 비디오 스트림으로 복구됨");
                } else {
                    console.warn("기존 비디오 트랙이 없음");
                }

                setScreenStream(null);
            }
        }
    };
    
        
    
    // 랜덤 색상 생성 함수
    const generateRandomColor = (senderId) => {
        // senderId를 해시 값으로 변환하여 고유 색상 생성
        let hash = 0;
        for (let i = 0; i < senderId.length; i++) {
        hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
        }
    
        // 해시 값을 이용하여 색상 생성
        const color = '#' + ((hash >> 24) & 0xFF).toString(16).padStart(2, '0')
                        + ((hash >> 16) & 0xFF).toString(16).padStart(2, '0')
                        + ((hash >> 8) & 0xFF).toString(16).padStart(2, '0');
        return color;
    };

    //이름 변경하기
    //변경된 이름 전송
    const sendChangeName = (changeUserName) => {
        if (!changeUserName.trim()) { return; } //비어있을 경우 메시지를 보내지 않음
        if (changeUserName===userDataRef.current.userName) { return; }

        const message = {
            eventId: 'changeName',
            userId: userData.userId,
            newName: changeUserName
        };

        setUserData({
            ...userDataRef.current,
            userName: changeUserName
        });
        
        sendMessage(message);
        setchangeUserName(""); // 입력창 초기화
    }

    //변경된 이름 수신
    const ReceivedChangeName = ({userId, newName}) => {
        setParticipants(prev => {
            const updated = { ...prev };
            const updatedParticipants = updated[userId];
            if (updatedParticipants) {
                updatedParticipants.updateUserName(newName);
            }
            return updated;
        });
    }

    // 비디오/오디오 설정 변경 함수들
    // 비디오/오디오 장치 목록 가져오기
    const getDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoList = devices.filter(device => device.kind === 'videoinput'); // 비디오 장치
            const audioList = devices.filter(device => device.kind === 'audioinput'); // 오디오 장치
            setVideoDevices(videoList);
            setAudioDevices(audioList);
        } catch (error) {
            console.error("장치 목록을 가져오는 데 실패했습니다.", error);
        }
    };

    // 컴포넌트 마운트 시 장치 목록 가져오기
    useEffect(() => {
        getDevices();
        return () => {
            // 컴포넌트가 언마운트될 때 스트림 종료
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // 비디오/오디오 장치 변경 후 적용
    const applyDeviceChanges = async () => {
        // 기존 스트림이 있으면 종료
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    
        // 새로운 비디오 및 오디오 장치 스트림 가져오기
        const constraints = {
            video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
            audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        };
    
        try {
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            streamRef.current = stream;
    
            // 내 참가자 정보 가져오기
            const myUserId = userDataRef.current?.userId;
            const participant = participants[myUserId];
    
            if (!participant) {
                console.warn("내 Participant 정보를 찾을 수 없습니다.");
                return;
            }
    
            // 내 비디오 태그에 스트림 적용
            const videoElement = participant.getVideoElement();
            if (videoElement) {
                videoElement.srcObject = newStream;
            }
    
            // peerConnection이 있는지 확인 후 replaceTrack
            if (!participant.rtcPeer || !participant.rtcPeer.peerConnection) {
                console.warn("peerConnection이 존재하지 않습니다.");
                return;
            }
    
            const peerConnection = participant.rtcPeer.peerConnection;
    
            // 비디오 트랙 교체
            const videoTrack = newStream.getVideoTracks()[0];
            if (videoTrack) {
                const videoSender = peerConnection.getSenders().find(
                    s => s.track && s.track.kind === 'video'
                );
                if (videoSender) {
                    await videoSender.replaceTrack(videoTrack);
                    console.log('비디오 트랙 교체 완료');
                } else {
                    console.warn('비디오 sender를 찾지 못했습니다.');
                }
            }
    
            // 오디오 트랙 교체
            const audioTrack = newStream.getAudioTracks()[0];
            if (audioTrack) {
                const audioSender = peerConnection.getSenders().find(
                    s => s.track && s.track.kind === 'audio'
                );
                if (audioSender) {
                    await audioSender.replaceTrack(audioTrack);
                    console.log('오디오 트랙 교체 완료');
                } else {
                    console.warn('오디오 sender를 찾지 못했습니다.');
                }
            }
    
            // 디버깅용 로그
            console.log('선택된 비디오:', selectedVideoDevice);
            console.log('선택된 오디오:', selectedAudioDevice);
            newStream.getTracks().forEach(track => {
                console.log(`${track.kind} 트랙:`, track.label);
            });
    
        } catch (error) {
            console.error("비디오/오디오 장치 변경에 실패했습니다.", error);
        }
    };
    
    

    // 모달 열기
    const openModal = () => {
        setShowModal(true);
    };

    // 모달 닫기
    const closeModal = () => {
        setShowModal(false);
        applyDeviceChanges(); // 장치 변경 적용
    };
    

    return(
        <>
            {!prevUserData.userName ? (
                <WaitingRoom action={action} onDataChange={handleUserDataChange} />
            ) : (
                <div className="VideoCallRoom">
                <header>
                    <div>
                        <div className="icon"> <VideoCameraFilled /> </div>
                        <div className="title">
                            <p className="titlename">{creatorData.userName}님의 통화방</p>
                            {/* <p className="date">시간</p> */}
                        </div>
                    </div>
                </header>
                <section style={{ display: 'flex' }}>
                    <div className="left" style={{ width: leftWidth }}>
                        <div id="participant" className="participant">
                            {/* 참가자 목록 및 비디오 설정 */}
                            <div id="mainVideo"></div>
                            <div id="subVideo" style={{ display: totalSlides <= 1 ? 'none' : 'flex' }}>
                                <button onClick={slideLeft} 
                                style={{
                                 pointerEvents: isSlideButtonDisabled ? 'none' : 'auto', // 참가자가 6명 미만일 때 비활성화
                                 color: isSlideButtonDisabled ? 'transparent':'black'}}><LeftOutlined /></button>
                                <div className="video-slider"> 
                                    <div className="slider-box" 
                                    style={{ transform: `translateX(-${currentSlide * 20}%)`,
                                    justifyContent: isSlideButtonDisabled ? 'center' : 'flex-start' }}>
                                    </div>
                                </div>
                                <button onClick={slideRight} style={{
                                 pointerEvents: isSlideButtonDisabled ? 'none' : 'auto', // 참가자가 6명 미만일 때 비활성화
                                 color: isSlideButtonDisabled ? 'transparent' : 'black' }}><RightOutlined /></button>
                            </div>
                        </div>
                        <div className="setting">
                            <div className="setting-icon">
                                {/* 오디오 토글 버튼 */}
                                <span style={{ backgroundColor: userDataRef.current.audioOn ? "#0060FF" : "#EB5757" }} onClick={toggleAudio}>
                                    {userDataRef.current.audioOn ? <AudioOutlined /> : <AudioMutedOutlined />} 
                                </span>
                                
                                {/* 비디오 토글 버튼 */}
                                <span style={{ backgroundColor: userDataRef.current.videoOn ? "#0060FF" : "#EB5757" }} onClick={toggleVideo}>
                                    {userDataRef.current.videoOn ? <VideoCameraFilled /> : <VideoCameraOutlined />}
                                </span>
                                <span style={{ backgroundColor: isSharing ? "#0041ab" :"#0060FF" }} className="screen-share"  onClick={toggleScreenShare}>
                                    <DesktopOutlined />
                                </span>
                                <span className="chat" onClick={toggleChat}>
                                    <CommentOutlined />
                                </span>
                                <span className="emoji" onClick={toggleEmoji}>
                                    <SmileOutlined />
                                </span>
                                <span className="change-setting" onClick={openModal}><SettingOutlined /></span>
                                <span onClick={exitRoom} className="exit">
                                    <PhoneOutlined />
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="right" style={{ width: rightWidth, display:displayOn }}>
                        <div className="user-list" style={{height: listOpen ? '30%' : '11%'}}>
                            <div className="select" onClick={toggleList}>
                                {listOpen ? <UpOutlined /> : <DownOutlined />}
                                <p>Participants({totalSlides})</p>
                            </div>
                            {listOpen&&(<div id="userList">
                                <div className="list-box">
                                    {Object.values(participants).map((participant) => (
                                    <div key={participant.userId}>
                                        {participant.userName}
                                    </div>
                                    ))}
                                </div>
                            </div>)}
                        </div>
                        <div className="user-chat" style={{height: listOpen ? '55%' : '74%'}}>
                            <div className="select">
                                <p className={`select-chat ${chatOn ? 'active' : ''}`} onClick={() => toggleSection('chat')}>Chat</p>
                                <p className={`select-emoji ${emojiOn ? 'active' : ''}`} onClick={() => toggleSection('emoji')}>Emoji</p>
                                <p className="close" onClick={toggleClose}><CloseOutlined /></p>
                            </div>
        
                            {/* 채팅창 조건부 렌더링 */}
                            {chatOn && (
                                <div id="chat" className="chat">
                                    <div className="message-list">
                                    {/* chatMessages와 userEvents를 모두 렌더링 */}
                                    {(chatMessages.length > 0 || userEvents.length > 0) ? (
                                        <>
                                            {/* userEvents 배열 렌더링 */}
                                            {userEvents.map((event, index) => (
                                                <div id="eventMessage" key={`event-${index}`} className="message">
                                                    <em>{event.message}</em> {/* 입장/퇴장 메시지 */}
                                                </div>
                                            ))}

                                            {/* messages 배열 렌더링 */}
                                            {chatMessages.map((msg, index) => (
                                                <div key={`message-${index}`} className="message">
                                                    <span className="user-profile" id={`profile-${msg.senderId}`} style={{ backgroundColor: generateRandomColor(msg.senderId) }}>{msg.senderName[0]}</span> 
                                                    <span className="message-box" style={{backgroundColor: msg.senderId === userDataRef.current.userId ? "#DFEBFF" : "white"}}>
                                                        <p>{msg.senderName}</p>
                                                        {msg.message}
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    
                                    ) : (
                                        <div className="message">채팅 메시지가 없습니다.</div>
                                    )}
                                    </div>
                                </div>
                            )}

        
                            {/* 이모지 창 조건부 렌더링 */}
                            {emojiOn && (
                                <div className="emoji">
                                    <div className="message-list">
                                    {emojiMessages.map((message, index) => (
                                        <div key={index} className="message">
                                            <span className="user-profile" id={`profile-${message.senderId}`} style={{ backgroundColor: generateRandomColor(message.senderId)}}>{message.senderName[0]} </span>
                                            <span className="message-box" style={{backgroundColor: message.senderId === userDataRef.current.userId ? "#DFEBFF" : "white"}}>
                                                <p>{message.senderName}</p>
                                                {/* 이모지 이름에 해당하는 이미지를 찾아서 표시 */}
                                                {emojis
                                                    .filter(emoji => emoji.name === message.emoji) // 이모지 이름으로 필터링
                                                    .map((emoji, idx) => (
                                                        <img key={idx} src={emoji.src} alt={emoji.alt} /> // 해당 이모지 이미지 출력
                                                    ))}
                                            </span>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="sender-box">
                            <div className="sender">
                                <div className="user-select">
                                    <span>수신자: </span>
                                    <select name="user" id="userSelect">
                                        <option value={chatOn ? "ALL" : userDataRef.current.userId}>{chatOn ? "모두에게" : "나에게"}</option>
                                        {Object.values(participants).map(participant => (
                                            participant.userId !== userDataRef.current.userId && (  // 자기자신을 제외
                                                <option key={participant.userId} value={participant.userId}>
                                                    {participant.userName}
                                                </option>
                                            )
                                        ))}
                                    </select>
                                </div>
                                <div className="input-send" style={emojiOn?{backgroundColor:'white'}:{backgroundColor:'#F6F6F6'}}>
                                {chatOn && (
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="메시지 보내기" 
                                            value={sendChat}
                                            onChange={(e) => setSendChat(e.target.value)} 
                                        />
                                        <button onClick={() => sendChatMessage(sendChat)}> 
                                            <SendOutlined />
                                        </button>
                                    </div>
                                )}
                                {emojiOn && (
                                    <div>
                                        <div className="emoji-menu">
                                        {emojis.map((emoji, index) => (
                                            <button key={index} onClick={() => sendEmojiMessage(emoji.name)}>
                                                <img src={emoji.src} alt={emoji.alt}/>
                                            </button>
                                        ))}
                                        </div>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* 모달 창 */}
                {showModal && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1000,
                        }}
                        onClick={closeModal}  // 모달 밖 클릭 시 닫기
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '10px',
                                width: '40%',
                            }}
                            onClick={(e) => e.stopPropagation()} // 모달 내 클릭은 닫히지 않도록 방지
                        >
                            <h3>이름 변경</h3>
                            <input 
                                type="text" 
                                placeholder={userDataRef.current.userName} 
                                value={changeUserName} 
                                onChange={(e)=> setchangeUserName(e.target.value)}/>
                            <button onClick={()=>sendChangeName(changeUserName)}>변경</button>
                            <br/>

                            <h3>비디오/오디오 설정</h3>
                            <div>
                                <label>비디오 장치</label>
                                <select 
                                    value={selectedVideoDevice} 
                                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                                >
                                    {videoDevices.map((device) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `비디오 장치 ${device.deviceId}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>오디오 장치</label>
                                <select 
                                    value={selectedAudioDevice} 
                                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                                >
                                    {audioDevices.map((device) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `오디오 장치 ${device.deviceId}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            
                            <button onClick={closeModal}>닫기</button>
                        </div>
                    </div>
                )}
            </div>
            )}
        </>
    );
}

export default VideoRoom;