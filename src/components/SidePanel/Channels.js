import React from 'react';
import firebase from '../../firebase';
import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react';

class Channels extends React.Component {
    state = {
        user: this.props.user,
        channels: [],
        channelName: '',
        channelDetails: '',
        channelsRef: firebase.database().ref('channels'),
        messagesRef: firebase.database().ref('messages'),
        typingRef: firebase.database().ref('typing'),
        notifications: [],
        modal: false,
        firstLoad: true
    };

    filterChannels(channels) {
        return channels.filter(channel => !this.props.starredChannels.some(starredChannel => channel.id === starredChannel.id));
    }

    componentDidMount() {
        this.addListeners();
    }

    componentWillUnmount() {
        this.removeListeners();
    }

    addListeners = () => {
        let loadedChannels = [];
        this.state.channelsRef.on('child_added', snap => {
            loadedChannels.push(snap.val());
            this.setState({ channels: loadedChannels }, () => this.setFirstChannel());
            this.addNotificationListener(snap.key);
        });
    };

    addNotificationListener = channelId => {
        this.state.messagesRef.child(channelId).on('value', snap => {
            if (this.props.channel) {
                this.handleNotifications(channelId, this.props.channel.id, this.state.notifications, snap);
            }
        })
    };

    handleNotifications = (channelId, currentChannelId, notifications, snap) => {
        let lastTotal = 0;

        let index = notifications.findIndex(notification => notification.id === channelId);

        if (index !== -1) {
            if (channelId !== currentChannelId) {
                lastTotal = notifications[index].total;

                let newMessagesCount = snap.numChildren() - lastTotal;

                if (newMessagesCount > 0) {
                    notifications[index].count = newMessagesCount;
                }
            }
            notifications[index].lastKnownTotal = snap.numChildren();
        } else {
            notifications.push({
                id: channelId,
                total: snap.numChildren(),
                lastKnownTotal: snap.numChildren(),
                count: 0
            })
        }

        this.setState({ notifications });
    };

    removeListeners = () => {
        this.state.channelsRef.off();
        this.state.channels.forEach(channel => {
            this.state.messagesRef.child(channel.id).off();
        })
    };

    setFirstChannel = () => {
        const firstChannel = this.state.channels[0];
        if (this.state.firstLoad && this.state.channels.length > 0) {
            this.props.setCurrentChannel(firstChannel);
            this.setState({ channel: firstChannel });
        }
        this.setState({ firstLoad: false });
    }

    addChannel = () => {
        const { user, channelsRef, channelName, channelDetails } = this.state;

        const key = channelsRef.push().key;

        const newChannel = {
            id: key,
            name: channelName,
            details: channelDetails,
            createdBy: {
                name: user.displayName,
                avatar: user.photoURL
            }
        };

        channelsRef
            .child(key)
            .update(newChannel)
            .then(() => {
                this.setState({ channelName: '', channelDetails: ''});
                this.closeModal();
                console.log('channel added');
            })
            .catch(err => {
                console.error(err);
            });
    };

    handleSubmit = event => {
        event.preventDefault();
        if (this.isFormValid(this.state)) {
            this.addChannel();
        }
    };
    
    handleChange = event => {
        this.setState({ [event.target.name]: event.target.value });
    };

    changeChannel = channel => {
        this.state.typingRef
                .child(this.props.channel.id)
                .child(this.state.user.uid)
                .remove();
        this.clearNotifications(channel);
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
        this.setState({ channel });
    };

    clearNotifications = channel => {
        let index = this.state.notifications.findIndex(notification => notification.id === channel.id);
        
        if (index !== -1) {
            let updatedNotifications = [...this.state.notifications];
            updatedNotifications[index].total = this.state.notifications[index].lastKnownTotal;
            updatedNotifications[index].count = 0;
            this.setState({ notifications: updatedNotifications });
        }
    };

    displayChannels = channels => (
        channels.length > 0 && channels.map(channel => (
            <Menu.Item
                key={channel.id}
                onClick={() => this.changeChannel(channel)}
                name={channel.name}
                active={this.props.channel ? channel.id === this.props.channel.id : false}
            >
                {this.getNotificationCount(channel) && (
                    <Label color="red">{this.getNotificationCount(channel)}</Label>
                )}
                # {channel.name}
            </Menu.Item>
        ))
    );

    getNotificationCount = channel => {
        let count = 0;

        this.state.notifications.forEach(notification => {
            if (notification.id === channel.id) {
                count = notification.count;
            }
        });

        if (count > 0) return count;
    };

    isFormValid = ({ channelName, channelDetails}) => channelName && channelDetails;

    openModal = () => this.setState({ modal: true });

    closeModal = () => this.setState({
        channelName: '',
        channelDetails: '',
        modal: false
    });

    render() {
        const { channels, modal } = this.state;
        const filteredChannels = this.filterChannels(channels);

        return (
            <React.Fragment>
                <Menu.Menu className="Menu">
                    <Menu.Item>
                        <span>
                            <Icon name="exchange" /> CHANNELS
                        </span>{" "}
                        ({ channels.length }) <Icon name="add" onClick={this.openModal} />
                    </Menu.Item>
                    {this.displayChannels(filteredChannels)}
                </Menu.Menu>

                <Modal basic open={modal} onClose={this.closeModal}>
                    <Modal.Header>Add a channel</Modal.Header>
                    <Modal.Content>
                        <Form onSubmit={this.handleSubmit}>
                            <Form.Field>
                                <Input 
                                    fluid
                                    label="Name of Channel"
                                    name="channelName"
                                    onChange={this.handleChange}
                                />
                            </Form.Field>

                            <Form.Field>
                                <Input 
                                    fluid
                                    label="About the Channel"
                                    name="channelDetails"
                                    onChange={this.handleChange}
                                />
                            </Form.Field>
                        </Form>
                    </Modal.Content>

                    <Modal.Actions>
                        <Button color="green" inverted onClick={this.handleSubmit}>
                            <Icon name="checkmark" /> Add
                        </Button>
                        <Button color="red" inverted onClick={this.closeModal}>
                            <Icon name="remove" /> Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
            </React.Fragment>
        );
    }
}

export default Channels;