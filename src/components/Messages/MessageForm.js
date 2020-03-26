import React from 'react';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import { Segment, Button, Input } from 'semantic-ui-react';
import { Picker, emojiIndex } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

import FileModal from './FileModal';
import ProgressBar from './ProgressBar';

class MessageForm extends React.Component {
    state = {
        message: '',
        loading: false,
        errors: [],
        modal: false,
        uploadState: '',
        uploadTask: null,
        storageRef: firebase.storage().ref(),
        typingRef: firebase.database().ref('typing'),
        percentUploaded: 0,
        emojiPicker: false
    };

    componentWillUnmount() {
        if (this.state.uploadTask !== null) {
            this.state.uploadTask.cancel();
            this.setState({ uploadTask: null });
        }
    }

    openModal = () => this.setState({ modal: true });

    closeModal = () => this.setState({ modal: false });

    handleChange = event => {
        const message = event.target.value;

        this.setState({ message });
        this.updateTyping(message);
    };

    handleKeyDown = event => {
        if (event.keyCode === 13) {
            this.sendMessage();
        }
    }

    handleTogglePicker = () => {
        this.setState({ emojiPicker: !this.state.emojiPicker });

    };

    handleAddEmoji = emoji => {
        const oldMessage = this.state.message;
        const newMessage = this.colonToUnicode(`${oldMessage} ${emoji.colons} `);
        this.setState({ message: newMessage, emojiPicker: false });
        setTimeout(() => this.messageInputRef.focus(), 0);
    };

    updateTyping = message => {
        const { typingRef } = this.state;
        const { currentUser, currentChannel } = this.props;

        if (message) {
            typingRef
                .child(currentChannel.id)
                .child(currentUser.uid)
                .set(currentUser.displayName);
        } else {
            typingRef
                .child(currentChannel.id)
                .child(currentUser.uid)
                .remove();
        }
    };

    colonToUnicode = message => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
            x = x.replace(/:/g, "");
            let emoji = emojiIndex.emojis[x];
            if (typeof emoji !== "undefined") {
                let unicode = emoji.native;
                if (typeof unicode !== "undefined") {
                    return unicode;
                }
            }
            x = ":" + x + ":";
            return x;
        });
    };

    createMessage = (fileUrl = null) => {
        const { currentUser } = this.props;

        const message = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            user: {
                id: currentUser.uid,
                name: currentUser.displayName,
                avatar: currentUser.photoURL
            },
        };
        if (fileUrl !== null) {
            message['image'] = fileUrl;
        } else {
            message['content'] = this.state.message;
        }
        return message;
    };

    sendMessage = () => {
        const { getMessagesRef, currentChannel, currentUser} = this.props;
        const { message, typingRef } = this.state;
        
        if (message) {
            this.setState({ loading: true });
            getMessagesRef()
                .child(currentChannel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({ loading: false, message: '', errors: [] });
                    typingRef
                        .child(currentChannel.id)
                        .child(currentUser.uid)
                        .remove();
                })
                .catch(err => {
                    console.error(err);
                    this.setState({
                        loading: false,
                        errors: this.state.errors.concat(err)
                    });
                });
        } else {
            this.setState({
                errors: this.state.errors.concat({ message: 'Add a message'})
            });
        }
    };

    getPath = () => {
        if (this.props.isPrivateChannel) {
            return `chat/private/${this.props.currentChannel.id}`;
        } else {
            return `chat/public`;
        }
    }

    uploadFile = (file, metadata) => {
        const pathToUpload = this.props.currentChannel.id;
        const ref = this.props.getMessagesRef();
        const filePath = `${this.getPath()}/${uuidv4()}.jpg`;

        this.setState({
                uploadState: 'uploading',
                uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
            },
            () => {
                this.state.uploadTask.on('state_changed', snap => {
                    const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    this.props.isProgressBarVisible(percentUploaded);
                    this.setState({ percentUploaded });
                },
                err => {
                    console.error(err);
                    this.setState({
                        errors: this.state.errors.concat(err),
                        uploadState: 'error',
                        uploadTask: null
                    })
                },
                () => {
                    this.state.uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                        this.sendFileMessage(downloadURL, ref, pathToUpload);
                    })
                    .catch(err => {
                        console.error(err);
                        this.setState({
                            errors: this.state.errors.concat(err),
                            uploadState: 'error',
                            uploadTask: null
                        })
                    })
                }
                )
            }   
        );
    };

    sendFileMessage = (fileUrl, ref, pathToUpload) => {
        ref.child(pathToUpload)
            .push()
            .set(this.createMessage(fileUrl))
            .then(() => {
                this.setState({ uploadState: 'done' });
            })
            .catch(err => {
                console.error(err);
                this.setState({
                    errors: this.state.errors.concat(err)
                });
            });
    }

    render() {
        const { errors, message, loading, modal, uploadState, percentUploaded, emojiPicker } = this.state;

        return (
            <Segment id="message__form">
                {emojiPicker && (
                    <Picker
                        set="apple"
                        onSelect={this.handleAddEmoji}
                        className="emojipicker"
                        title="Pick your emoji"
                        emoji="point_up"
                    />
                )}
                <Input 
                    fluid
                    autoFocus
                    name="message"
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    value={message}
                    ref={node => (this.messageInputRef = node)}
                    style={{ marginBottom: '.7em' }}
                    labelPosition="left"
                    className={
                        errors.some(error => error.message.includes('message')) 
                        ? "error" 
                        : ""
                    }
                    placeholder="Write your message"
                />
                <Button.Group>
                    <Button 
                        icon={emojiPicker ? 'close' : 'add'} 
                        content={emojiPicker ? 'Close' : null}
                        onClick={this.handleTogglePicker} 
                    />
                    <Button
                        disabled={uploadState === "uploading"}
                        onClick={this.openModal}
                        icon="cloud upload"
                    />
                </Button.Group>
                <FileModal
                    modal={modal}
                    closeModal={this.closeModal}
                    uploadFile={this.uploadFile}
                />
                <ProgressBar
                    uploadState={uploadState}
                    percentUploaded={percentUploaded}
                />
            </Segment>
        );
    }
}

export default MessageForm;