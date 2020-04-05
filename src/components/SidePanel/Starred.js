import React from 'react';
import { connect } from 'react-redux';
import firebase from '../../firebase';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import { Menu, Icon } from 'semantic-ui-react';

class Starred extends React.Component {
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

    changeChannel = channel => {
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
    };

    displayChannels = channels => (
        channels.length > 0 && channels.map(channel => (
            <Menu.Item
                key={channel.id}
                onClick={() => this.changeChannel(channel)}
                name={channel.name}
                style={{ opacity: .7 }}
                active={this.props.channel ? channel.id === this.props.channel.id : false}
            >
                # {channel.name}
            </Menu.Item>
        ))
    );

    render() {
        const { starredChannels } = this.state;

        return (
            <Menu.Menu className="Menu">
                <Menu.Item>
                    <span>
                        <Icon name="star" /> STARRED
                    </span>{" "}
                    ({ starredChannels.length })
                </Menu.Item>
                {this.displayChannels(starredChannels)}
            </Menu.Menu>
        );
    }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Starred);