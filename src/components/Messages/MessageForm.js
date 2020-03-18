import React from 'react';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import { Segment, Button, Input } from 'semantic-ui-react';

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
        percentUploaded: 0
    };

    openModal = () => this.setState({ modal: true });

    closeModal = () => this.setState({ modal: false });

    handleChange = event => {
        this.setState({ [event.target.name]: event.target.value });
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
        const { messagesRef, currentChannel } = this.props;
        const { message } = this.state;
        
        if (message) {
            this.setState({ loading: true });
            messagesRef
                .child(currentChannel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({ loading: false, message: '', errors: [] });
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

    uploadFile = (file, metadata) => {
        const pathToUpload = this.props.currentChannel.id;
        const ref = this.props.messagesRef;
        const filePath = `chat/public/${uuidv4()}.jpg`;

        this.setState({
                uploadState: 'uploading',
                uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
            },
            () => {
                this.state.uploadTask.on('state_changed', snap => {
                    const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
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
        const { errors, message, loading, modal, uploadState, percentUploaded } = this.state;

        return (
            <Segment id="message__form">
                <Input 
                    fluid
                    name="message"
                    onChange={this.handleChange}
                    value={message}
                    style={{ marginBottom: '.7em' }}
                    label={<Button icon={'add'} />}
                    labelPosition="left"
                    className={
                        errors.some(error => error.message.includes('message')) 
                        ? "error" 
                        : ""
                    }
                    placeholder="Write your message"
                />
                <Button.Group icon widths="2">
                    <Button
                        onClick={this.sendMessage}
                        disabled={loading}
                        color="orange"
                        content="Add Reply"
                        labelPosition="left"
                        icon="edit"
                    />
                    <Button 
                        color="teal"
                        onClick={this.openModal}
                        content="Upload Media"
                        labelPosition="right"
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