import React from 'react';
import { connect } from 'react-redux';
import firebase from '../../firebase';

import { Menu } from 'semantic-ui-react';

import { setCurrentChannel, setPrivateChannel } from '../../actions';

import UserPanel from './UserPanel';
import Channels from './Channels';
import DirectMessages from './DirectMessages';
import Starred from './Starred';

class SidePanel extends React.Component {
    state = {
        user: this.props.user,
        usersRef: firebase.database().ref('users'),
        starredChannels: []
    }

    componentDidMount() {
        if (this.state.user) {
            this.addListeners(this.state.user.uid);
        }
    }

    componentWillUnmount() {
        this.removeListener();
    }

    removeListener = () => {
        this.state.usersRef.child(`${this.state.user.uid}/starred`).off();
    }

    addListeners = userId => {
        this.state.usersRef
            .child(userId)
            .child('starred')
            .on('child_added', snap => {
                const starredChannel = { id: snap.key, ...snap.val() };
                this.setState({
                    starredChannels: [...this.state.starredChannels, starredChannel]
                }); 
            });

        this.state.usersRef
            .child(userId)
            .child('starred')
            .on('child_removed', snap => {
                const channelToRemove = { id: snap.key, ...snap.val() };
                const filteredChannels = this.state.starredChannels.filter(channel => {
                    return channel.id !== channelToRemove.id;
                });
                this.setState({ starredChannels: filteredChannels });
            });
    };

    render() {
        return (
            <Menu
                size="large"
                inverted
                fixed="left"
                vertical
            >
                <UserPanel user={this.props.user} />
                <Starred 
                    user={this.props.user}
                    channel={this.props.channel}
                    starredChannels={this.state.starredChannels}
                />
                <Channels 
                    user={this.props.user} 
                    channel={this.props.channel}
                    starredChannels={this.state.starredChannels}
                    setCurrentChannel={this.props.setCurrentChannel}
                    setPrivateChannel={this.props.setPrivateChannel}
                />
                <DirectMessages
                    user={this.props.user}
                    channel={this.props.channel}
                    setCurrentChannel={this.props.setCurrentChannel}
                    setPrivateChannel={this.props.setPrivateChannel}
                />
            </Menu>
        );
    }
}

const mapStateToProps = state => ({
    user: state.user.currentUser,
    channel: state.channel.currentChannel
});

export default connect(mapStateToProps, { setCurrentChannel, setPrivateChannel })(SidePanel);