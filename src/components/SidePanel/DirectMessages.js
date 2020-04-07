import React from 'react';
import firebase from '../../firebase';
import { Menu, Icon } from 'semantic-ui-react';

class DirectMessages extends React.Component {
    state = {
        users: [],
        usersRef: firebase.database().ref('users'),
        connectedRef: firebase.database().ref('.info/connected'),
        presenceRef: firebase.database().ref('presence')
    }

    componentDidMount() {
        if (this.props.user) {
            this.addListeners(this.props.user.uid);
        }
    }

    componentWillUnmount() {
        this.removeListeners();
    }

    removeListeners = () => {
        this.state.usersRef.off();
        this.state.presenceRef.off();
        this.state.connectedRef.off();
    }

    addListeners = currentUserUid => {
        let loadedUsers = [];
        this.state.usersRef.on('child_added', snap => {
            let user = snap.val();
            user['uid'] = snap.key;
            currentUserUid === snap.key ? user['status'] = 'online' : user['status'] = 'offline';
            loadedUsers.push(user);
            this.setState({ users: loadedUsers });
        });

        this.state.connectedRef.on('value', snap => {
            if (snap.val() === true) {
                const ref = this.state.presenceRef.child(currentUserUid);
                ref.set(true);
                ref.onDisconnect().remove(err => {
                    if (err !== null) {
                        console.error(err);
                    }
                });
            }
        });

        this.state.presenceRef.on('child_added', snap => {
            if (currentUserUid !== snap.key) {
                this.addStatusToUser(snap.key);
            }
        });

        this.state.presenceRef.on('child_removed', snap => {
            if (currentUserUid !== snap.key) {
                this.addStatusToUser(snap.key, false)
            }
        });
    };

    addStatusToUser = (userId, connected = true) => {
        const updatedUsers = this.state.users.reduce((acc, user) => {
            if (user.uid === userId) {
                user['status'] = `${connected ? 'online' : 'offline'}`;
            }
            return acc.concat(user);
        }, []);

        this.setState({ user: updatedUsers });
    };

    isUserOnline = user => user.status === 'online';

    changeChannel = user => {
        const channelId = this.getChannelId(user.uid);
        const channelData = {
            id: channelId,
            name: user.name
        };
        this.props.setCurrentChannel(channelData);
        this.props.setPrivateChannel(true);
    };

    getChannelId = userId => {
        const currentUserUid = this.props.user.uid;
        return userId < currentUserUid ? 
            `${userId}/${currentUserUid}` : `${currentUserUid}/${userId}`;
    };

    render() {
        const { users } = this.state;

        return (
            <Menu.Menu className="Menu">
                <Menu.Item>
                    <span>
                        <Icon name="mail" />DIRECT MESSAGES
                    </span>{' '}
                    ({users.length})
                </Menu.Item>
                {users.map(user => (
                    <Menu.Item
                        key={user.uid}
                        active={this.props.channel ? this.getChannelId(user.uid) === this.props.channel.id : false}
                        onClick={() => this.changeChannel(user)}
                        className={!this.isUserOnline(user) ? 'offline' : ''}
                    >
                        <Icon
                            name={this.isUserOnline(user) ? "circle" : "circle outline"}
                            className={this.isUserOnline(user) ? 'online' : ''}
                        />
                        @ {user.name} { user.uid === this.props.user.uid ? <span className="you">(you)</span> : '' }
                    </Menu.Item>
                ))}
            </Menu.Menu>
        );
    }
}

export default DirectMessages;