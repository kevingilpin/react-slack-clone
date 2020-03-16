import React from 'react';
import { Segment, Comment } from 'semantic-ui-react';
import firebase from '../../firebase';
import { connect } from 'react-redux';

import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';

class Messages extends React.Component {
    state = {
        messagesRef: firebase.database().ref('messages')
    }
    
    render() {
        const { messagesRef } = this.state;
        const { currentChannel, currentUser } = this.props;

        return (
            <React.Fragment>
                <MessagesHeader />

                <Segment>
                    <Comment.Group className="messages">

                    </Comment.Group>
                </Segment>

                <MessageForm 
                    messagesRef={messagesRef}
                    currentChannel={currentChannel}
                    currentUser={currentUser}
                />
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => ({
    currentChannel: state.channel.currentChannel,
    currentUser: state.user.currentUser
});

export default connect(mapStateToProps)(Messages);